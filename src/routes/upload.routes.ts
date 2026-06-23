import { Router } from "express";
import { uploadFile, deleteFile, uploadMiddleware } from "../controllers/upload.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

export const uploadRouter = Router();

uploadRouter.post("/", authMiddleware, uploadMiddleware, uploadFile);
uploadRouter.delete("/", authMiddleware, deleteFile);
