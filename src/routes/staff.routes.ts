import { Router } from "express";
import { listShifts, saveShifts, getOptimization } from "../controllers/staff.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
export const staffRouter = Router();
staffRouter.get("/shifts", authMiddleware, listShifts);
staffRouter.post("/shifts", authMiddleware, saveShifts);
staffRouter.get("/optimization", authMiddleware, getOptimization);
