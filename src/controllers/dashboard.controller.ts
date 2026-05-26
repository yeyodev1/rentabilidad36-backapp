import { Response } from "express";
import { AuthRequest } from "../types/AuthRequest";
import * as dashboardService from "../services/dashboard.service";
import { Branch } from "../models/Branch.model";
import { Company } from "../models/Company.model";

export async function getDashboardData(req: AuthRequest, res: Response) {
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
      if (!company) {
        res.status(400).json({ message: "No company found for user" });
        return;
      }
      const mainBranch = await Branch.findOne({ companyId: company._id, isMain: true });
      if (!mainBranch) {
        res.status(400).json({ message: "No main branch found" });
        return;
      }
      targetBranchId = mainBranch._id.toString();
    }

    const kpis = await dashboardService.getDashboardKPIs(targetBranchId);
    const alerts = await dashboardService.getCriticalAlerts(targetBranchId);
    const staffSuggestions = await dashboardService.getStaffSuggestions(targetBranchId);

    res.json({ kpis, alerts, staffSuggestions });
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching dashboard data", error: error.message });
  }
}

export async function getAlerts(req: AuthRequest, res: Response) {
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
      if (!company) {
        res.status(400).json({ message: "No company found for user" });
        return;
      }
      const mainBranch = await Branch.findOne({ companyId: company._id, isMain: true });
      if (!mainBranch) {
        res.status(400).json({ message: "No main branch found" });
        return;
      }
      targetBranchId = mainBranch._id.toString();
    }

    const alerts = await dashboardService.getCriticalAlerts(targetBranchId);
    res.json(alerts);
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching alerts", error: error.message });
  }
}

export async function getStaffOptimization(req: AuthRequest, res: Response) {
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
      if (!company) {
        res.status(400).json({ message: "No company found for user" });
        return;
      }
      const mainBranch = await Branch.findOne({ companyId: company._id, isMain: true });
      if (!mainBranch) {
        res.status(400).json({ message: "No main branch found" });
        return;
      }
      targetBranchId = mainBranch._id.toString();
    }

    const suggestions = await dashboardService.getStaffSuggestions(targetBranchId);
    res.json(suggestions);
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching staff optimization", error: error.message });
  }
}
