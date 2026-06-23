import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import {
  getDashboardHistory,
  getAllUsers,
  triggerAlert,
  sendReminder,
} from "../controllers/admin.controller";

export const adminRouter = Router();

adminRouter.use(authMiddleware);
adminRouter.use(requireRole("admin"));

adminRouter.get("/history", getDashboardHistory);
adminRouter.get("/users", getAllUsers);
adminRouter.post("/alert", triggerAlert);
adminRouter.post("/reminder", sendReminder);
