import { Router } from "express";
import { mandateController } from "../controllers/mandate.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validate } from "../middlewares/validate";
import { validateObjectIdParam } from "../middlewares/validateObjectIdParam";
import { validateQuery } from "../middlewares/validateQuery";
import { asyncHandler } from "../utils/asyncHandler";
import {
  createMandateSchema,
  listMandatesQuerySchema,
  updateMandateSchema,
} from "../validators/mandate.validator";

export const mandateRouter = Router();

mandateRouter.use(authenticate);

mandateRouter.get("/", validateQuery(listMandatesQuerySchema), asyncHandler(mandateController.list));
mandateRouter.get("/:id", validateObjectIdParam(), asyncHandler(mandateController.getById));
mandateRouter.post(
  "/",
  authorize("SUPER_ADMIN", "LCP"),
  validate(createMandateSchema),
  asyncHandler(mandateController.create),
);
mandateRouter.patch(
  "/:id",
  authorize("SUPER_ADMIN", "LCP"),
  validateObjectIdParam(),
  validate(updateMandateSchema),
  asyncHandler(mandateController.update),
);
mandateRouter.delete(
  "/:id",
  authorize("SUPER_ADMIN", "LCP"),
  validateObjectIdParam(),
  asyncHandler(mandateController.remove),
);
