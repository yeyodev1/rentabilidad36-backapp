import { Response } from "express";
import { AuthRequest } from "../types/AuthRequest";
import * as checklistService from "../services/checklist.service";
import * as ocrService from "../services/ocr.service";
import { ChecklistTemplate } from "../models/ChecklistTemplate.model";
import { ChecklistInstance } from "../models/ChecklistInstance.model";
import { Branch } from "../models/Branch.model";
import { Company } from "../models/Company.model";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["jpg", "jpeg", "png", "webp"];
    const ext = (file.originalname.split(".").pop() || "").toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (jpg, jpeg, png, webp) are allowed"));
    }
  },
});

export { upload as checklistUpload };

export async function listTemplates(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const company = await Company.findOne({ userId });
    if (!company) {
      res.status(400).json({ message: "Company not found" });
      return;
    }

    const filter: Record<string, unknown> = { companyId: company._id, isActive: true };
    const category = req.query.category as string | undefined;
    if (category) {
      filter.category = category;
    }

    const templates = await ChecklistTemplate.find(filter).sort({ category: 1, name: 1 });
    res.json(templates);
  } catch (error: any) {
    res.status(500).json({ message: "Error listing templates", error: error.message });
  }
}

export async function createTemplate(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const company = await Company.findOne({ userId });
    if (!company) {
      res.status(400).json({ message: "Company not found" });
      return;
    }

    const { name, category, description, fields } = req.body;

    if (!name || typeof name !== "string") {
      res.status(400).json({ message: "Template name is required" });
      return;
    }

    const validCategories = ["cocina_insumos", "atencion_planta", "caja_finanzas"];
    if (!category || !validCategories.includes(category)) {
      res.status(400).json({ message: `Category must be one of: ${validCategories.join(", ")}` });
      return;
    }

    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      res.status(400).json({ message: "At least one field is required" });
      return;
    }

    for (const field of fields) {
      if (!field.label || !field.type) {
        res.status(400).json({ message: "Each field must have label and type" });
        return;
      }
    }

    const template = await ChecklistTemplate.create({
      companyId: company._id,
      name,
      category,
      description: description || "",
      fields: fields.map((f: any, i: number) => ({
        label: f.label,
        type: f.type,
        required: f.required || false,
        order: f.order ?? i,
      })),
      isActive: true,
    });

    res.status(201).json(template);
  } catch (error: any) {
    res.status(500).json({ message: "Error creating template", error: error.message });
  }
}

export async function updateTemplate(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const company = await Company.findOne({ userId });
    if (!company) {
      res.status(400).json({ message: "Company not found" });
      return;
    }

    const { id } = req.params;
    const template = await ChecklistTemplate.findOne({ _id: id, companyId: company._id });
    if (!template) {
      res.status(404).json({ message: "Template not found" });
      return;
    }

    const { name, category, description, fields } = req.body;

    if (name !== undefined) template.name = name;
    if (category !== undefined) {
      const validCategories = ["cocina_insumos", "atencion_planta", "caja_finanzas"];
      if (!validCategories.includes(category)) {
        res.status(400).json({ message: `Category must be one of: ${validCategories.join(", ")}` });
        return;
      }
      template.category = category;
    }
    if (description !== undefined) template.description = description;
    if (fields !== undefined) {
      if (!Array.isArray(fields) || fields.length === 0) {
        res.status(400).json({ message: "At least one field is required" });
        return;
      }
      template.fields = fields.map((f: any, i: number) => ({
        label: f.label,
        type: f.type,
        required: f.required || false,
        order: f.order ?? i,
      })) as any;
    }

    await template.save();
    res.json(template);
  } catch (error: any) {
    res.status(500).json({ message: "Error updating template", error: error.message });
  }
}

export async function deleteTemplate(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const company = await Company.findOne({ userId });
    if (!company) {
      res.status(400).json({ message: "Company not found" });
      return;
    }

    const { id } = req.params;
    const template = await ChecklistTemplate.findOneAndUpdate(
      { _id: id, companyId: company._id },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!template) {
      res.status(404).json({ message: "Template not found" });
      return;
    }

    res.json({ message: "Template deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: "Error deleting template", error: error.message });
  }
}

export async function createInstance(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const company = await Company.findOne({ userId });
    if (!company) {
      res.status(400).json({ message: "Company not found" });
      return;
    }

    const { templateId, branchId, scheduledDate } = req.body;

    if (!templateId || !branchId) {
      res.status(400).json({ message: "templateId and branchId are required" });
      return;
    }

    const branch = await Branch.findOne({ _id: branchId, companyId: company._id });
    if (!branch) {
      res.status(404).json({ message: "Branch not found" });
      return;
    }

    const instance = await checklistService.createInstance({
      templateId,
      branchId,
      operatorId: userId,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
    });

    const user = req.user;
    await ChecklistInstance.findByIdAndUpdate(instance._id, {
      $set: { operatorName: user?.email || "" },
    });

    const updated = await ChecklistInstance.findById(instance._id).populate("templateId");
    res.status(201).json(updated);
  } catch (error: any) {
    res.status(500).json({ message: "Error creating checklist instance", error: error.message });
  }
}

export async function submitChecklist(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    const { responses, photoUrl } = req.body;

    if (!responses || !Array.isArray(responses)) {
      res.status(400).json({ message: "Responses array is required" });
      return;
    }

    await checklistService.submitResponse(String(id), userId, responses, String(photoUrl || ""));
    const instance = await ChecklistInstance.findById(id).populate("templateId");

    res.json(instance);
  } catch (error: any) {
    res.status(500).json({ message: "Error submitting checklist", error: error.message });
  }
}

export async function reviewChecklist(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (req.user?.accountType !== "admin") {
      res.status(403).json({ message: "Only admins can review checklists" });
      return;
    }

    const { id } = req.params;
    const { comments, approved } = req.body;

    if (approved === undefined || !comments) {
      res.status(400).json({ message: "approved and comments are required" });
      return;
    }

    await checklistService.reviewInstance(String(id), userId, String(comments), approved);
    const instance = await ChecklistInstance.findById(id).populate("templateId");

    res.json(instance);
  } catch (error: any) {
    res.status(500).json({ message: "Error reviewing checklist", error: error.message });
  }
}

export async function getDailyChecklists(req: AuthRequest, res: Response) {
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

    const instances = await ChecklistInstance.find({
      branchId: targetBranchId,
      date: { $gte: todayStart, $lte: todayEnd },
    }).populate("templateId").sort({ createdAt: -1 });

    res.json(instances);
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching daily checklists", error: error.message });
  }
}

export async function getPendingReviews(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const company = await Company.findOne({ userId });
    if (!company) {
      res.status(400).json({ message: "Company not found" });
      return;
    }

    const branches = await Branch.find({ companyId: company._id });
    const branchIds = branches.map((b) => b._id);

    const instances = await ChecklistInstance.find({
      branchId: { $in: branchIds },
      status: { $in: ["pending", "reviewed"] },
    }).populate("templateId").sort({ createdAt: -1 });

    res.json(instances);
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching pending reviews", error: error.message });
  }
}

export async function downloadPDF(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const pdfBuffer = await checklistService.generatePDF(String(id));

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="checklist-${id}.pdf"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    res.status(500).json({ message: "Error generating PDF", error: error.message });
  }
}

export async function uploadPhotoOCR(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const file = (req as any).file;
    if (!file) {
      res.status(400).json({ message: "Image file is required" });
      return;
    }

    const result = await ocrService.processChecklistImageBuffer(file.buffer);

    if (!result.success) {
      res.status(422).json(result);
      return;
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: "Error processing OCR", error: error.message });
  }
}
