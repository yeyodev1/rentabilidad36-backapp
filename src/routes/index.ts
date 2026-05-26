import express, { Application } from "express";
import { authRouter } from "./auth.routes";
import { analysisRouter } from "./analysis.routes";
import { tiendaRouter } from "./tienda.routes";
import { onboardingRouter } from "./onboarding.routes";
import { dashboardRouter } from "./dashboard.routes";
import { checklistRouter } from "./checklist.routes";
import { maintenanceRouter } from "./maintenance.routes";
import { staffRouter } from "./staff.routes";
import { workspaceRouter } from "./workspace.routes";

function routerApi(app: Application) {
  const router = express.Router();
  app.use("/api", router);

  router.use("/auth", authRouter);
  router.use("/analysis", analysisRouter);
  router.use("/tiendas", tiendaRouter);
  router.use("/onboarding", onboardingRouter);
  router.use("/dashboard", dashboardRouter);
  router.use("/checklists", checklistRouter);
  router.use("/maintenance", maintenanceRouter);
  router.use("/staff", staffRouter);
  router.use("/workspace", workspaceRouter);
}

export default routerApi;
