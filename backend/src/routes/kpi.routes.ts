import { Router } from "express";
import { kpiController } from "../controllers/kpi.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validate } from "../middlewares/validate";
import { validateObjectIdParam } from "../middlewares/validateObjectIdParam";
import { validateQuery } from "../middlewares/validateQuery";
import { asyncHandler } from "../utils/asyncHandler";
import { createKpiSchema, listKpisQuerySchema, updateKpiSchema } from "../validators/kpi.validator";

export const kpiRouter = Router();

kpiRouter.use(authenticate);

kpiRouter.get("/", validateQuery(listKpisQuerySchema), asyncHandler(kpiController.list));
kpiRouter.get("/:id", validateObjectIdParam(), asyncHandler(kpiController.getById));
kpiRouter.post(
  "/",
  authorize("SUPER_ADMIN", "LCP", "VP", "TEAM_LEADER"),
  validate(createKpiSchema),
  asyncHandler(kpiController.create),
);
kpiRouter.patch(
  "/:id",
  authorize("SUPER_ADMIN", "LCP", "VP", "TEAM_LEADER"),
  validateObjectIdParam(),
  validate(updateKpiSchema),
  asyncHandler(kpiController.update),
);
kpiRouter.delete(
  "/:id",
  authorize("SUPER_ADMIN", "LCP", "VP", "TEAM_LEADER"),
  validateObjectIdParam(),
  asyncHandler(kpiController.remove),
);
