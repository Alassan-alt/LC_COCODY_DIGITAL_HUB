import { Router } from "express";
import { eventController } from "../controllers/event.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validate } from "../middlewares/validate";
import { validateObjectIdParam } from "../middlewares/validateObjectIdParam";
import { validateQuery } from "../middlewares/validateQuery";
import { asyncHandler } from "../utils/asyncHandler";
import {
  createEventSchema,
  listEventsQuerySchema,
  markAttendanceSchema,
  updateAttendanceSchema,
  updateEventSchema,
} from "../validators/event.validator";

export const eventRouter = Router();

eventRouter.use(authenticate);

eventRouter.get("/", validateQuery(listEventsQuerySchema), asyncHandler(eventController.list));
eventRouter.get("/:id", validateObjectIdParam(), asyncHandler(eventController.getById));
eventRouter.post(
  "/",
  authorize("SUPER_ADMIN", "LCP", "VP", "TEAM_LEADER"),
  validate(createEventSchema),
  asyncHandler(eventController.create),
);
eventRouter.patch(
  "/:id",
  authorize("SUPER_ADMIN", "LCP", "VP", "TEAM_LEADER"),
  validateObjectIdParam(),
  validate(updateEventSchema),
  asyncHandler(eventController.update),
);
eventRouter.delete(
  "/:id",
  authorize("SUPER_ADMIN", "LCP", "VP", "TEAM_LEADER"),
  validateObjectIdParam(),
  asyncHandler(eventController.remove),
);

eventRouter.get(
  "/:id/attendances",
  validateObjectIdParam(),
  asyncHandler(eventController.listAttendances),
);
eventRouter.post(
  "/:id/attendances",
  validateObjectIdParam(),
  validate(markAttendanceSchema),
  asyncHandler(eventController.markAttendance),
);
eventRouter.patch(
  "/:id/attendances/:attendanceId",
  validateObjectIdParam(),
  validateObjectIdParam("attendanceId"),
  validate(updateAttendanceSchema),
  asyncHandler(eventController.updateAttendance),
);
