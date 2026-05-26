import { SalesRecord } from "../models/SalesRecord.model";
import { SanitaryLog } from "../models/SanitaryLog.model";
import { Equipment } from "../models/Equipment.model";
import { StaffShift } from "../models/StaffShift.model";
import { calculateAnalysis } from "./analysis.service";

function getStartOfDay(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

function getEndOfDay(): Date {
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  return now;
}

export async function getDashboardKPIs(branchId: string): Promise<{
  todaySales: number;
  estimatedProfit: number;
  averageTicket: number;
  breakEven: { units: number; currency: number };
  arcsaStatus: "green" | "yellow" | "red";
  criticalEquipment: number;
  weakHours: Array<{ hour: number; sales: number; transactions: number }>;
}> {
  const todayStart = getStartOfDay();
  const todayEnd = getEndOfDay();

  const todayRecords = await SalesRecord.find({
    branchId,
    createdAt: { $gte: todayStart, $lte: todayEnd },
  });

  const todaySales = todayRecords.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalTransactions = todayRecords.length;
  const averageTicket = totalTransactions > 0 ? todaySales / totalTransactions : 0;

  const branch = await (await import("../models/Branch.model")).Branch.findById(branchId);
  const company = branch?.companyId
    ? await (await import("../models/Company.model")).Company.findById(branch.companyId)
    : null;

  const analysis = calculateAnalysis({
    avgPrice: averageTicket || 10,
    monthlyClients: 30,
    rawMaterialPercent: 35,
    monthlyRent: 0,
    totalFixedCosts: 2000,
    variableUnitCost: 0,
  });

  const estimatedVariableCost = todaySales * 0.35;
  const dailyFixedAliquot = (company ? 2000 : 2000) / 30;
  const estimatedProfit = todaySales - estimatedVariableCost - dailyFixedAliquot;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentLogs = await SanitaryLog.find({
    branchId,
    createdAt: { $gte: sevenDaysAgo },
  });

  let arcsaStatus: "green" | "yellow" | "red" = "green";
  if (recentLogs.length > 0) {
    const passed = recentLogs.filter((l: any) => l.passed).length;
    const passRate = (passed / recentLogs.length) * 100;
    if (passRate >= 80) arcsaStatus = "green";
    else if (passRate >= 50) arcsaStatus = "yellow";
    else arcsaStatus = "red";
  }

  const criticalEquipment = await Equipment.countDocuments({
    branchId,
    $or: [
      { status: { $ne: "operativo" } },
      {
        lastMaintenanceDate: {
          $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    ],
  });

  const hourlySales = await SalesRecord.aggregate([
    {
      $match: {
        branchId: branchId,
        createdAt: { $gte: todayStart, $lte: todayEnd },
      },
    },
    {
      $group: {
        _id: { $hour: "$createdAt" },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const overallAvg =
    hourlySales.length > 0
      ? hourlySales.reduce((s, h) => s + h.total, 0) / hourlySales.length
      : 0;

  const weakHours = hourlySales
    .filter((h) => h.total < overallAvg * 0.5)
    .map((h) => ({
      hour: h._id,
      sales: h.total,
      transactions: h.count,
    }));

  return {
    todaySales: Math.round(todaySales * 100) / 100,
    estimatedProfit: Math.round(estimatedProfit * 100) / 100,
    averageTicket: Math.round(averageTicket * 100) / 100,
    breakEven: {
      units: analysis.breakEvenUnits,
      currency: analysis.breakEvenCurrency,
    },
    arcsaStatus,
    criticalEquipment,
    weakHours,
  };
}

export async function getCriticalAlerts(branchId: string): Promise<Array<object>> {
  const alerts: Array<{
    type: string;
    severity: "critical" | "warning";
    title: string;
    message: string;
  }> = [];

  const pendingChecklistCount = await (await import("../models/ChecklistInstance.model"))
    .ChecklistInstance.countDocuments({ branchId, status: "pending" });

  if (pendingChecklistCount > 3) {
    alerts.push({
      type: "checklist",
      severity: "warning",
      title: "Checklists pendientes",
      message: `Hay ${pendingChecklistCount} checklists sin revisar.`,
    });
  }

  const overdueEquipment = await Equipment.countDocuments({
    branchId,
    $or: [
      { status: "averiado" },
      { status: "fuera_servicio" },
    ],
  });

  if (overdueEquipment > 0) {
    alerts.push({
      type: "maintenance",
      severity: "critical",
      title: "Equipos con mantenimiento vencido",
      message: `${overdueEquipment} equipo(s) requieren atención inmediata.`,
    });
  }

  const kpis = await getDashboardKPIs(branchId);
  if ((kpis as any).estimatedProfit < 0) {
    alerts.push({
      type: "margin",
      severity: "critical",
      title: "Margen negativo hoy",
      message: "Las ventas de hoy no cubren los costos operativos.",
    });
  }

  if ((kpis as any).weakHours && (kpis as any).weakHours.length > 2) {
    alerts.push({
      type: "weak_hours",
      severity: "warning",
      title: "Horas de baja actividad",
      message: `${kpis.weakHours.length} bloques horarios están por debajo del 50% del promedio.`,
    });
  }

  return alerts;
}

export async function getStaffSuggestions(branchId: string): Promise<Array<object>> {
  const suggestions: Array<{
    hour: number;
    suggestedReduction: number;
    currentStaff: number;
    reason: string;
  }> = [];

  const todayStart = getStartOfDay();
  const todayEnd = getEndOfDay();

  const hourlySales = await SalesRecord.aggregate([
    {
      $match: {
        branchId: branchId,
        createdAt: { $gte: todayStart, $lte: todayEnd },
      },
    },
    {
      $group: {
        _id: { $hour: "$createdAt" },
        transactions: { $sum: 1 },
        sales: { $sum: "$amount" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const shifts = await StaffShift.find({ branchId, date: { $gte: todayStart, $lte: todayEnd } });
  const staffCostPerHour = 5;

  for (const hour of hourlySales) {
    const staffCount = shifts.filter((s) => {
      const startH = parseInt(s.startTime?.split(":")[0] || "0", 10);
      const endH = parseInt(s.endTime?.split(":")[0] || "0", 10);
      return hour._id >= startH && hour._id < endH;
    }).length;

    if (staffCount > 0) {
      const revenuePerStaff = hour.sales / staffCount;
      const costPerStaff = staffCostPerHour;

      if (revenuePerStaff < costPerStaff * 0.75) {
        suggestions.push({
          hour: hour._id,
          suggestedReduction: Math.ceil(staffCount * 0.5),
          currentStaff: staffCount,
          reason: `Ingreso por empleado ($${revenuePerStaff.toFixed(2)}) está por debajo del 75% del costo por hora ($${costPerStaff.toFixed(2)})`,
        });
      }
    }
  }

  return suggestions;
}
