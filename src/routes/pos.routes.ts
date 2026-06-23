import express from "express";
import { authMiddleware as authenticate } from "../middlewares/auth.middleware";
import * as posController from "../controllers/pos.controller";

export const posRouter = express.Router();

posRouter.use(authenticate);

posRouter.get("/", posController.getConnections);
posRouter.post("/", posController.createConnection);
posRouter.delete("/:id", posController.deleteConnection);
