import { Router } from "express";
import { notificationController } from "../controllers/notification.controller";
import { authenticate } from "../middlewares/authenticate";
import { validateObjectIdParam } from "../middlewares/validateObjectIdParam";
import { validateQuery } from "../middlewares/validateQuery";
import { asyncHandler } from "../utils/asyncHandler";
import { listNotificationsQuerySchema } from "../validators/notification.validator";

export const notificationRouter = Router();

notificationRouter.use(authenticate);

notificationRouter.get(
  "/",
  validateQuery(listNotificationsQuerySchema),
  asyncHandler(notificationController.list),
);
notificationRouter.patch(
  "/:id/read",
  validateObjectIdParam(),
  asyncHandler(notificationController.markRead),
);
notificationRouter.post("/read-all", asyncHandler(notificationController.markAllRead));
