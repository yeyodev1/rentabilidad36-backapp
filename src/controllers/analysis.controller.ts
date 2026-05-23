import { Request, Response } from "express";
import { Analysis } from "../models/Analysis.model";
import { calculateAnalysis } from "../services/analysis.service";
import { AuthRequest } from "../types/AuthRequest";

export async function createAnalysis(req: AuthRequest, res: Response) {
  const { projectName, businessType, currency, investment, avgPrice, monthlyClients, rawMaterialPercent, monthlyRent } = req.body;

  if (!projectName || !businessType || avgPrice == null || monthlyClients == null || rawMaterialPercent == null || monthlyRent == null) {
    res.status(400).json({ message: "Missing required fields" });
    return;
  }

  const results = calculateAnalysis({
    avgPrice: Number(avgPrice),
    monthlyClients: Number(monthlyClients),
    rawMaterialPercent: Number(rawMaterialPercent),
    monthlyRent: Number(monthlyRent),
  });

  const analysis = new Analysis({
    userId: req.user?.userId,
    projectName,
    businessType,
    currency: currency || "USD",
    investment: investment || 0,
    avgPrice: Number(avgPrice),
    monthlyClients: Number(monthlyClients),
    rawMaterialPercent: Number(rawMaterialPercent),
    monthlyRent: Number(monthlyRent),
    results,
  });

  await analysis.save();

  res.status(201).json(analysis);
}

export async function getAnalysis(req: AuthRequest, res: Response) {
  const { id } = req.params;

  const analysis = await Analysis.findById(id);
  if (!analysis) {
    res.status(404).json({ message: "Analysis not found" });
    return;
  }

  if (analysis.userId && analysis.userId !== req.user?.userId) {
    res.status(403).json({ message: "Not authorized" });
    return;
  }

  res.json(analysis);
}
