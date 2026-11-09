import { Router } from "express";
import { dashboardController } from "../controllers/dashboard.controller";
import { authenticate } from "../middlewares/authenticate";
import { asyncHandler } from "../utils/asyncHandler";

export const dashboardRouter = Router();

dashboardRouter.use(authenticate);
dashboardRouter.get("/", asyncHandler(dashboardController.get));
