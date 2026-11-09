import { Router } from "express";
import { transitionController } from "../controllers/transition.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validate } from "../middlewares/validate";
import { validateObjectIdParam } from "../middlewares/validateObjectIdParam";
import { validateQuery } from "../middlewares/validateQuery";
import { asyncHandler } from "../utils/asyncHandler";
import {
  createChecklistItemSchema,
  createTransitionPackageSchema,
  listTransitionPackagesQuerySchema,
  updateChecklistItemSchema,
  updateTransitionPackageSchema,
} from "../validators/transition.validator";

export const transitionRouter = Router();

// Gouvernance de fin de mandat : réservé SUPER_ADMIN/LCP (RG-08, continuité
// entre mandats), plus strict que les autres modules "managers" à 4 rôles.
transitionRouter.use(authenticate, authorize("SUPER_ADMIN", "LCP"));

transitionRouter.get("/", validateQuery(listTransitionPackagesQuerySchema), asyncHandler(transitionController.list));
transitionRouter.get("/:id", validateObjectIdParam(), asyncHandler(transitionController.getById));
transitionRouter.get(
  "/:id/content",
  validateObjectIdParam(),
  asyncHandler(transitionController.getContent),
);
transitionRouter.post(
  "/",
  validate(createTransitionPackageSchema),
  asyncHandler(transitionController.create),
);
transitionRouter.patch(
  "/:id",
  validateObjectIdParam(),
  validate(updateTransitionPackageSchema),
  asyncHandler(transitionController.update),
);

transitionRouter.get(
  "/:id/checklist",
  validateObjectIdParam(),
  asyncHandler(transitionController.listChecklist),
);
transitionRouter.post(
  "/:id/checklist",
  validateObjectIdParam(),
  validate(createChecklistItemSchema),
  asyncHandler(transitionController.addChecklistItem),
);
transitionRouter.patch(
  "/:id/checklist/:itemId",
  validateObjectIdParam(),
  validateObjectIdParam("itemId"),
  validate(updateChecklistItemSchema),
  asyncHandler(transitionController.updateChecklistItem),
);
transitionRouter.delete(
  "/:id/checklist/:itemId",
  validateObjectIdParam(),
  validateObjectIdParam("itemId"),
  asyncHandler(transitionController.deleteChecklistItem),
);
