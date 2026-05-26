import { ChecklistTemplate } from "../models/ChecklistTemplate.model";
import { ChecklistInstance } from "../models/ChecklistInstance.model";
import PDFDocument from "pdfkit";
import { Buffer } from "buffer";
import mongoose from "mongoose";

const DEFAULT_CATEGORIES = ["apertura", "operacion", "cierre"];

export async function getDefaultTemplates(companyId: string): Promise<Array<typeof ChecklistTemplate.prototype>> {
  const templates: Array<typeof ChecklistTemplate.prototype> = [];

  for (const category of DEFAULT_CATEGORIES) {
    let template = await ChecklistTemplate.findOne({ companyId, category });

    if (!template) {
      template = await ChecklistTemplate.create({
        companyId: new mongoose.Types.ObjectId(companyId),
        category,
        name: `Checklist de ${category}`,
        items: getDefaultItemsForCategory(category),
        isActive: true,
      });
    }

    templates.push(template);
  }

  return templates;
}

function getDefaultItemsForCategory(category: string): Array<{ label: string; type: "boolean" | "text" | "photo" }> {
  const itemsByCategory: Record<string, Array<{ label: string; type: "boolean" | "text" | "photo" }>> = {
    apertura: [
      { label: "Encender equipos", type: "boolean" },
      { label: "Verificar temperatura de cámaras", type: "text" },
      { label: "Revisar stock inicial", type: "boolean" },
      { label: "Estado del piso y mesas", type: "photo" },
    ],
    operacion: [
      { label: "Limpieza de áreas", type: "boolean" },
      { label: "Control de calidad de insumos", type: "text" },
      { label: "Rotación de productos", type: "boolean" },
    ],
    cierre: [
      { label: "Cierre de caja", type: "text" },
      { label: "Apagar equipos no necesarios", type: "boolean" },
      { label: "Bloquear accesos", type: "boolean" },
      { label: "Estado final del local", type: "photo" },
    ],
  };

  return itemsByCategory[category] || [];
}

export async function createInstance(data: {
  templateId: string;
  branchId: string;
  operatorId: string;
  scheduledDate: Date;
}): Promise<typeof ChecklistInstance.prototype> {
  const template = await ChecklistTemplate.findById(data.templateId);
  if (!template) throw new Error("Template not found");

  const instance = await ChecklistInstance.create({
    templateId: new mongoose.Types.ObjectId(data.templateId),
    branchId: new mongoose.Types.ObjectId(data.branchId),
    operatorId: new mongoose.Types.ObjectId(data.operatorId),
    scheduledDate: data.scheduledDate,
    status: "pending",
    items: (template as any).items.map((item: any) => ({
      label: item.label,
      type: item.type,
      value: null,
    })),
  });

  return instance;
}

export async function submitResponse(
  instanceId: string,
  operatorId: string,
  responses: Array<{ itemIndex: number; value: string | boolean }>,
  photoUrl?: string
): Promise<void> {
  const instance = await ChecklistInstance.findById(instanceId);
  if (!instance) throw new Error("Instance not found");

  const inst = instance as any;
  inst.responses = responses;
  inst.operatorId = new mongoose.Types.ObjectId(operatorId);
  inst.photoUrl = photoUrl || null;
  inst.submittedAt = new Date();
  await inst.save();
}

export async function reviewInstance(
  instanceId: string,
  reviewerId: string,
  comments: string,
  approved: boolean
): Promise<void> {
  const instance = await ChecklistInstance.findById(instanceId);
  if (!instance) throw new Error("Instance not found");

  const inst = instance as any;
  inst.status = approved ? "approved" : "reviewed";
  inst.reviewerId = new mongoose.Types.ObjectId(reviewerId);
  inst.reviewerComments = comments;
  inst.reviewedAt = new Date();
  await inst.save();
}

export async function generatePDF(instanceId: string): Promise<Buffer> {
  const instance = await ChecklistInstance.findById(instanceId)
    .populate("templateId")
    .populate("operatorId");
  if (!instance) throw new Error("Instance not found");

  const doc = new PDFDocument({ margin: 40 });
  const chunks: Buffer[] = [];

  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  return new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text("Checklist", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Fecha: ${(instance as any).scheduledDate?.toLocaleDateString() || "N/A"}`);
    doc.text(`Estado: ${instance.status}`);
    doc.moveDown();

    const inst = instance as any;
    if (inst.responses && inst.responses.length > 0) {
      doc.fontSize(14).text("Respuestas:", { underline: true });
      doc.moveDown(0.5);

      for (const r of inst.responses) {
        const item = inst.items[r.itemIndex];
        if (item) {
          doc.fontSize(11).text(`${item.label}: ${String(r.value)}`);
        }
      }

      doc.moveDown();
    }

    doc.moveDown(2);
    doc.fontSize(10).text(`Generado el: ${new Date().toLocaleString()}`, { align: "right" });

    doc.end();
  });
}

export async function getDailyPending(branchId: string): Promise<Array<typeof ChecklistInstance.prototype>> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  return ChecklistInstance.find({
    branchId: new mongoose.Types.ObjectId(branchId),
    scheduledDate: { $gte: todayStart, $lte: todayEnd },
    status: "pending",
  }).populate("templateId");
}
