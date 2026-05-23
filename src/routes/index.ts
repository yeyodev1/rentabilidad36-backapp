import express, { Application } from "express";
import { authRouter } from "./auth.routes";
import { analysisRouter } from "./analysis.routes";
import { tiendaRouter } from "./tienda.routes";

function routerApi(app: Application) {
  const router = express.Router();
  app.use("/api", router);

  router.use("/auth", authRouter);
  router.use("/analysis", analysisRouter);
  router.use("/tiendas", tiendaRouter);
}

export default routerApi;
