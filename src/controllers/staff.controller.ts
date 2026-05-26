import { Response } from "express";
import { AuthRequest } from "../types/AuthRequest";
import { StaffShift } from "../models/StaffShift.model";
import { SalesRecord } from "../models/SalesRecord.model";
import { Branch } from "../models/Branch.model";
import { Company } from "../models/Company.model";

export async function listShifts(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const branchId = req.query.branchId as string | undefined;

    let targetBranchId = branchId;
    if (!targetBranchId) {
      const company = await Company.findOne({ userId });
      if (company) {
        const mainBranch = await Branch.findOne({ companyId: company._id, isMain: true });
        if (mainBranch) targetBranchId = mainBranch._id.toString();
      }
    }

    if (!targetBranchId) {
      res.status(400).json({ message: "Branch ID is required" });
      return;
    }

    const filter: Record<string, unknown> = { branchId: targetBranchId };
    const area = req.query.area as string | undefined;
    if (area) {
      filter.area = area;
    }

    const shifts = await StaffShift.find(filter).sort({ dayOfWeek: 1, startTime: 1 });
    res.json(shifts);
  } catch (error: any) {
    res.status(500).json({ message: "Error listing shifts", error: error.message });
  }
}

export async function saveShifts(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { branchId, area, shifts } = req.body;

    if (!branchId || !area || !shifts || !Array.isArray(shifts)) {
      res.status(400).json({ message: "branchId, area, and shifts array are required" });
      return;
    }

    if (!["cocina", "atencion"].includes(area)) {
      res.status(400).json({ message: "Area must be 'cocina' or 'atencion'" });
      return;
    }

    await StaffShift.deleteMany({ branchId, area });

    const shiftDocs = shifts.map((s: any) => ({
      branchId,
      area,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      staffCount: s.staffCount,
    }));

    const created = await StaffShift.insertMany(shiftDocs);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ message: "Error saving shifts", error: error.message });
  }
}

export async function getOptimization(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const branchId = req.query.branchId as string | undefined;

    let targetBranchId = branchId;
    if (!targetBranchId) {
      const company = await Company.findOne({ userId });
      if (company) {
        const mainBranch = await Branch.findOne({ companyId: company._id, isMain: true });
        if (mainBranch) targetBranchId = mainBranch._id.toString();
      }
    }

    if (!targetBranchId) {
      res.status(400).json({ message: "Branch ID is required" });
      return;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const hourlySales = await SalesRecord.aggregate([
      {
        $match: {
          branchId: targetBranchId,
          createdAt: { $gte: todayStart, $lte: todayEnd },
        },
      },
      {
        $group: {
          _id: { $hour: "$createdAt" },
          totalSales: { $sum: "$amount" },
          transactions: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const shifts = await StaffShift.find({ branchId: targetBranchId });

    const staffCostPerHour = 5;

    const optimization = hourlySales.map((hour) => {
      const hourNum = hour._id;
      const staffCount = shifts.filter((s) => {
        const startH = parseInt(s.startTime.split(":")[0], 10);
        const endH = parseInt(s.endTime.split(":")[0], 10);
        return hourNum >= startH && hourNum < endH;
      }).reduce((sum, s) => sum + s.staffCount, 0);

      const staffCost = staffCount * staffCostPerHour;
      const profit = hour.totalSales - staffCost;

      return {
        hour: hourNum,
        sales: hour.totalSales,
        transactions: hour.transactions,
        staffCount,
        staffCost,
        profit: Math.round(profit * 100) / 100,
        isOverstaffed: staffCount > 0 && (hour.totalSales / staffCount) < (staffCostPerHour * 0.75),
      };
    });

    const totalSales = hourlySales.reduce((s, h) => s + h.totalSales, 0);
    const totalStaffCost = shifts.reduce((s, h) => s + h.staffCount, 0) * staffCostPerHour;

    res.json({
      hourly: optimization,
      summary: {
        totalSales: Math.round(totalSales * 100) / 100,
        totalStaffCost,
        estimatedProfit: Math.round((totalSales - totalStaffCost) * 100) / 100,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error calculating staff optimization", error: error.message });
  }
}
