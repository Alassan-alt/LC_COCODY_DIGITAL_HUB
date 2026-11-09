import { Router } from "express";
import { meetingController } from "../controllers/meeting.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validate } from "../middlewares/validate";
import { validateObjectIdParam } from "../middlewares/validateObjectIdParam";
import { validateQuery } from "../middlewares/validateQuery";
import { asyncHandler } from "../utils/asyncHandler";
import {
  createDecisionSchema,
  createMeetingSchema,
  listMeetingsQuerySchema,
  updateMeetingSchema,
} from "../validators/meeting.validator";

export const meetingRouter = Router();

meetingRouter.use(authenticate);

meetingRouter.get("/", validateQuery(listMeetingsQuerySchema), asyncHandler(meetingController.list));
meetingRouter.get("/:id", validateObjectIdParam(), asyncHandler(meetingController.getById));
meetingRouter.post(
  "/",
  authorize("SUPER_ADMIN", "LCP", "VP", "TEAM_LEADER"),
  validate(createMeetingSchema),
  asyncHandler(meetingController.create),
);
meetingRouter.patch(
  "/:id",
  authorize("SUPER_ADMIN", "LCP", "VP", "TEAM_LEADER"),
  validateObjectIdParam(),
  validate(updateMeetingSchema),
  asyncHandler(meetingController.update),
);
meetingRouter.delete(
  "/:id",
  authorize("SUPER_ADMIN", "LCP", "VP", "TEAM_LEADER"),
  validateObjectIdParam(),
  asyncHandler(meetingController.remove),
);

meetingRouter.get("/:id/decisions", validateObjectIdParam(), asyncHandler(meetingController.listDecisions));
meetingRouter.post(
  "/:id/decisions",
  authorize("SUPER_ADMIN", "LCP", "VP", "TEAM_LEADER"),
  validateObjectIdParam(),
  validate(createDecisionSchema),
  asyncHandler(meetingController.createDecision),
);
