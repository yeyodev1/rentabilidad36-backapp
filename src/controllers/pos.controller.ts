import { Response } from "express";
import { AuthRequest } from "../types/AuthRequest";
import { POSConnection } from "../models/POSConnection.model";
import { Company } from "../models/Company.model";

async function resolveCompanyId(userId: string): Promise<string | null> {
  const company = await Company.findOne({ userId });
  return company ? company._id.toString() : null;
}

export async function getConnections(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const companyId = await resolveCompanyId(userId);
    if (!companyId) return res.status(400).json({ message: "No company found" });

    const connections = await POSConnection.find({ companyId }).sort({ createdAt: -1 });
    res.json(connections);
  } catch (error: any) {
    res.status(500).json({ message: "Error listing POS connections", error: error.message });
  }
}

export async function createConnection(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const companyId = await resolveCompanyId(userId);
    if (!companyId) return res.status(400).json({ message: "No company found" });

    const { provider, apiKey, storeId } = req.body;

    if (!provider) {
      return res.status(400).json({ message: "Provider is required" });
    }

    const connection = await POSConnection.create({
      companyId,
      provider,
      status: "active",
      settings: {
        apiKey: apiKey || "",
        storeId: storeId || "",
      },
    });

    res.status(201).json(connection);
  } catch (error: any) {
    res.status(500).json({ message: "Error creating POS connection", error: error.message });
  }
}

export async function deleteConnection(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    const connection = await POSConnection.findById(id);
    if (!connection) return res.status(404).json({ message: "Connection not found" });

    const companyId = await resolveCompanyId(userId);
    if (companyId && connection.companyId.toString() !== companyId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await POSConnection.findByIdAndDelete(id);
    res.json({ message: "POS Connection deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: "Error deleting POS connection", error: error.message });
  }
}
