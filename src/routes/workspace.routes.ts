import { Router } from "express";
import { getWorkspaces, getCurrentWorkspace } from "../controllers/workspace.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
export const workspaceRouter = Router();
workspaceRouter.get("/", authMiddleware, getWorkspaces);
workspaceRouter.get("/current", authMiddleware, getCurrentWorkspace);
