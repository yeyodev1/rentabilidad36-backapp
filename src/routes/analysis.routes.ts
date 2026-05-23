import { Router } from "express";
import { createAnalysis, getAnalysis } from "../controllers/analysis.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

export const analysisRouter = Router();

analysisRouter.post("/", authMiddleware, createAnalysis);
analysisRouter.get("/:id", authMiddleware, getAnalysis);
