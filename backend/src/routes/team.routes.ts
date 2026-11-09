import { Router } from "express";
import { teamController } from "../controllers/team.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validate } from "../middlewares/validate";
import { validateObjectIdParam } from "../middlewares/validateObjectIdParam";
import { validateQuery } from "../middlewares/validateQuery";
import { asyncHandler } from "../utils/asyncHandler";
import { createTeamSchema, listTeamsQuerySchema, updateTeamSchema } from "../validators/team.validator";

export const teamRouter = Router();

teamRouter.use(authenticate);

teamRouter.get("/", validateQuery(listTeamsQuerySchema), asyncHandler(teamController.list));
teamRouter.get("/:id", validateObjectIdParam(), asyncHandler(teamController.getById));
teamRouter.post(
  "/",
  authorize("SUPER_ADMIN", "LCP", "VP"),
  validate(createTeamSchema),
  asyncHandler(teamController.create),
);
teamRouter.patch(
  "/:id",
  authorize("SUPER_ADMIN", "LCP", "VP"),
  validateObjectIdParam(),
  validate(updateTeamSchema),
  asyncHandler(teamController.update),
);
teamRouter.delete(
  "/:id",
  authorize("SUPER_ADMIN", "LCP", "VP"),
  validateObjectIdParam(),
  asyncHandler(teamController.remove),
);
