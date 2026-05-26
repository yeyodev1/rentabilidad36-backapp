import { Router } from "express";
import { saveOnboardingStep, getOnboardingProgress, completeOnboarding } from "../controllers/onboarding.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
export const onboardingRouter = Router();
onboardingRouter.post("/step", authMiddleware, saveOnboardingStep);
onboardingRouter.get("/progress", authMiddleware, getOnboardingProgress);
onboardingRouter.post("/complete", authMiddleware, completeOnboarding);
