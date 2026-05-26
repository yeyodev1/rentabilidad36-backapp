import { Equipment } from "../models/Equipment.model";
import { MaintenanceTicket } from "../models/MaintenanceTicket.model";
import QRCode from "qrcode";

export function calculateDepreciation(purchaseDate: Date, historicalCost: number, usefulLife: number): number {
  const now = new Date();
  const purchaseTime = new Date(purchaseDate).getTime();
  const elapsedYears = (now.getTime() - purchaseTime) / (1000 * 60 * 60 * 24 * 365);

  if (elapsedYears >= usefulLife) return 0;

  const annualDepreciation = historicalCost / usefulLife;
  const accumulatedDepreciation = annualDepreciation * elapsedYears;

  return Math.round((historicalCost - accumulatedDepreciation) * 100) / 100;
}

export async function generateQRCode(equipmentId: string): Promise<string> {
  const equipment = await Equipment.findById(equipmentId);
  if (!equipment) throw new Error("Equipment not found");

  const qrData = JSON.stringify({
    id: equipment._id.toString(),
    name: equipment.name,
    brand: equipment.brand,
    branchId: equipment.branchId.toString(),
  });

  const qrCode = await QRCode.toDataURL(qrData);

  await Equipment.findByIdAndUpdate(equipmentId, { qrCode });

  return qrCode;
}

export async function checkOverdueMaintenance(): Promise<Array<typeof Equipment.prototype>> {
  const now = new Date();

  const overdue = await Equipment.find({
    $or: [
      {
        lastMaintenanceDate: { $exists: true },
        $expr: {
          $gt: [
            { $subtract: [now.getTime(), "$lastMaintenanceDate"] },
            { $multiply: ["$maintenanceIntervalDays", 24 * 60 * 60 * 1000] },
          ],
        },
      },
      {
        lastMaintenanceDate: { $exists: false },
      },
    ],
    status: { $ne: "fuera_servicio" },
  });

  for (const equipment of overdue) {
    const existingTicket = await MaintenanceTicket.findOne({
      equipmentId: equipment._id,
      status: { $in: ["abierto", "en_progreso"] },
    });

    if (!existingTicket) {
      await MaintenanceTicket.create({
        equipmentId: equipment._id,
        branchId: equipment.branchId,
        title: `Mantenimiento vencido: ${equipment.name}`,
        description: `El equipo ${equipment.name} requiere mantenimiento. Último mantenimiento: ${equipment.lastMaintenanceDate?.toLocaleDateString() || "Ninguno"}. Intervalo: cada ${equipment.maintenanceIntervalDays} días.`,
        priority: "alta",
        status: "abierto",
        createdAt: new Date(),
      });
    }
  }

  return overdue;
}

export async function createTicket(data: {
  equipmentId: string;
  branchId: string;
  title: string;
  description: string;
  priority: "baja" | "media" | "alta" | "critica";
  assignedTo?: string;
}): Promise<typeof MaintenanceTicket.prototype> {
  const ticket = await MaintenanceTicket.create({
    equipmentId: new (await import("mongoose")).Types.ObjectId(data.equipmentId),
    branchId: new (await import("mongoose")).Types.ObjectId(data.branchId),
    title: data.title,
    description: data.description,
    priority: data.priority || "media",
    assignedTo: data.assignedTo ? new (await import("mongoose")).Types.ObjectId(data.assignedTo) : undefined,
    status: "abierto",
  });

  return ticket;
}

export async function sendNotification(
  ticket: typeof MaintenanceTicket.prototype,
  type: "basic" | "pro"
): Promise<void> {
  const ticketData = {
    id: ticket._id.toString(),
    title: ticket.title,
    status: ticket.status,
    priority: ticket.priority,
  };

  console.log(`[${type.toUpperCase()}] Notificación de mantenimiento enviada:`, JSON.stringify(ticketData));

  if (type === "pro") {
    const equipment = await Equipment.findById(ticket.equipmentId);
    const deprecatedValue = equipment
      ? calculateDepreciation(equipment.purchaseDate, equipment.historicalCost, equipment.usefulLife)
      : 0;

    console.log(`[PRO] Depreciación actual del equipo: $${deprecatedValue}`);
  }
}
