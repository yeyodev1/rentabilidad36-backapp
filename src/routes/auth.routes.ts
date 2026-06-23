import { Router } from "express";
import { register, verify, resendCode, login } from "../controllers/auth.controller";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/verify", verify);
authRouter.post("/resend-code", resendCode);
authRouter.post("/login", login);
