import { Router } from "express";
import {
  listTiendas,
  createTienda,
  updateTienda,
  deleteTienda,
  setMainTienda,
} from "../controllers/tienda.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

export const tiendaRouter = Router();

tiendaRouter.get("/", authMiddleware, listTiendas);
tiendaRouter.post("/", authMiddleware, createTienda);
tiendaRouter.put("/:id", authMiddleware, updateTienda);
tiendaRouter.patch("/:id/main", authMiddleware, setMainTienda);
tiendaRouter.delete("/:id", authMiddleware, deleteTienda);
