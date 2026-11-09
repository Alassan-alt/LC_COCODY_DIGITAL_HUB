import { Router } from "express";
import { partnerController } from "../controllers/partner.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validate } from "../middlewares/validate";
import { validateObjectIdParam } from "../middlewares/validateObjectIdParam";
import { validateQuery } from "../middlewares/validateQuery";
import { asyncHandler } from "../utils/asyncHandler";
import {
  addActivitySchema,
  createPartnerSchema,
  listPartnersQuerySchema,
  updatePartnerSchema,
} from "../validators/partner.validator";

export const partnerRouter = Router();

partnerRouter.use(authenticate);
partnerRouter.use(authorize("SUPER_ADMIN", "LCP", "VP", "TEAM_LEADER"));

partnerRouter.get("/", validateQuery(listPartnersQuerySchema), asyncHandler(partnerController.list));
partnerRouter.get("/:id", validateObjectIdParam(), asyncHandler(partnerController.getById));
partnerRouter.post("/", validate(createPartnerSchema), asyncHandler(partnerController.create));
partnerRouter.patch(
  "/:id",
  validateObjectIdParam(),
  validate(updatePartnerSchema),
  asyncHandler(partnerController.update),
);
partnerRouter.delete("/:id", validateObjectIdParam(), asyncHandler(partnerController.remove));

partnerRouter.get(
  "/:id/activities",
  validateObjectIdParam(),
  asyncHandler(partnerController.listActivities),
);
partnerRouter.post(
  "/:id/activities",
  validateObjectIdParam(),
  validate(addActivitySchema),
  asyncHandler(partnerController.addActivity),
);
