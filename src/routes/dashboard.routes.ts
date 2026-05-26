import { Router } from "express";
import { getDashboardData, getAlerts, getStaffOptimization } from "../controllers/dashboard.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
export const dashboardRouter = Router();
dashboardRouter.get("/", authMiddleware, getDashboardData);
dashboardRouter.get("/alerts", authMiddleware, getAlerts);
dashboardRouter.get("/staff-optimization", authMiddleware, getStaffOptimization);
