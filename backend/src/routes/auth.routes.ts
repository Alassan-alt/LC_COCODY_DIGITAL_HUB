import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/authenticate";
import { authRateLimiter } from "../middlewares/rateLimit";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { changePasswordSchema, loginSchema, registerSchema } from "../validators/auth.validator";

export const authRouter = Router();

authRouter.post(
  "/register",
  authRateLimiter,
  validate(registerSchema),
  asyncHandler(authController.register),
);
authRouter.post("/login", authRateLimiter, validate(loginSchema), asyncHandler(authController.login));
authRouter.get("/me", authenticate, asyncHandler(authController.me));
authRouter.post("/logout", authenticate, authController.logout);
authRouter.patch(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  asyncHandler(authController.changePassword),
);
