import { Router } from "express";
import { memberController } from "../controllers/member.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validate } from "../middlewares/validate";
import { validateObjectIdParam } from "../middlewares/validateObjectIdParam";
import { validateQuery } from "../middlewares/validateQuery";
import { asyncHandler } from "../utils/asyncHandler";
import {
  createMemberSchema,
  listMembersQuerySchema,
  updateMemberSchema,
} from "../validators/member.validator";

export const memberRouter = Router();

memberRouter.use(authenticate);
memberRouter.use(authorize("SUPER_ADMIN", "LCP", "VP", "TEAM_LEADER"));

memberRouter.get("/", validateQuery(listMembersQuerySchema), asyncHandler(memberController.list));
memberRouter.get("/:id", validateObjectIdParam(), asyncHandler(memberController.getById));
memberRouter.post(
  "/",
  authorize("SUPER_ADMIN", "LCP"),
  validate(createMemberSchema),
  asyncHandler(memberController.create),
);
memberRouter.patch(
  "/:id",
  authorize("SUPER_ADMIN", "LCP"),
  validateObjectIdParam(),
  validate(updateMemberSchema),
  asyncHandler(memberController.update),
);
memberRouter.delete(
  "/:id",
  authorize("SUPER_ADMIN", "LCP"),
  validateObjectIdParam(),
  asyncHandler(memberController.remove),
);
