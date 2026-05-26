import { Response } from "express";
import { AuthRequest } from "../types/AuthRequest";
import { Company } from "../models/Company.model";
import { Branch } from "../models/Branch.model";
import { User } from "../models/User.model";

export async function getWorkspaces(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ message: "Unauthorized" }); return; }

    const user = await User.findById(userId);
    if (!user) { res.status(404).json({ message: "User not found" }); return; }

    const ids = user.workspaceIds || [];
    const companies = await Company.find({ _id: { $in: ids } }).lean();

    const workspaces = await Promise.all(
      companies.map(async (c) => {
        const branches = await Branch.find({ companyId: c._id }).lean();
        return {
          id: c._id,
          legalName: c.legalName,
          commercialName: c.commercialName,
          ruc: c.ruc,
          country: c.country,
          city: c.city,
          onboardingCompleted: c.onboardingCompleted,
          branches: branches.map((b) => ({
            id: b._id,
            name: b.name,
            address: b.address,
            phone: b.phone,
            isMain: b.isMain,
          })),
        };
      })
    );

    res.json({ workspaces, count: workspaces.length });
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching workspaces", error: error.message });
  }
}

export async function getCurrentWorkspace(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ message: "Unauthorized" }); return; }

    const user = await User.findById(userId);
    if (!user) { res.status(404).json({ message: "User not found" }); return; }

    const ids = user.workspaceIds || [];
    if (ids.length === 0) {
      res.json({ workspace: null });
      return;
    }

    const company = await Company.findById(ids[0]).lean();
    if (!company) { res.json({ workspace: null }); return; }

    const branches = await Branch.find({ companyId: company._id }).lean();

    res.json({
      workspace: {
        id: company._id,
        legalName: company.legalName,
        commercialName: company.commercialName,
        ruc: company.ruc,
        country: company.country,
        city: company.city,
        onboardingCompleted: company.onboardingCompleted,
        branches: branches.map((b) => ({
          id: b._id,
          name: b.name,
          address: b.address,
          phone: b.phone,
          isMain: b.isMain,
        })),
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching workspace", error: error.message });
  }
}
