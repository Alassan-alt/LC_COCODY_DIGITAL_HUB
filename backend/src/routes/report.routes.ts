import { Router } from "express";
import { reportController } from "../controllers/report.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validate } from "../middlewares/validate";
import { validateObjectIdParam } from "../middlewares/validateObjectIdParam";
import { validateQuery } from "../middlewares/validateQuery";
import { asyncHandler } from "../utils/asyncHandler";
import {
  createReportSchema,
  generateReportSchema,
  listReportsQuerySchema,
  updateReportSchema,
} from "../validators/report.validator";

export const reportRouter = Router();

reportRouter.use(authenticate);
// Le contenu généré peut inclure le solde financier (Phase 10) : mêmes
// permissions que /api/finance, pas d'accès MEMBER.
reportRouter.use(authorize("SUPER_ADMIN", "LCP", "VP", "TEAM_LEADER"));

reportRouter.get("/", validateQuery(listReportsQuerySchema), asyncHandler(reportController.list));
reportRouter.get("/:id", validateObjectIdParam(), asyncHandler(reportController.getById));
reportRouter.post("/", validate(createReportSchema), asyncHandler(reportController.create));
reportRouter.post("/generate", validate(generateReportSchema), asyncHandler(reportController.generate));
reportRouter.patch(
  "/:id",
  validateObjectIdParam(),
  validate(updateReportSchema),
  asyncHandler(reportController.update),
);
reportRouter.delete("/:id", validateObjectIdParam(), asyncHandler(reportController.remove));
