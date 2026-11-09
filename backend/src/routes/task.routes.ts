import { Router } from "express";
import { taskController } from "../controllers/task.controller";
import { authenticate } from "../middlewares/authenticate";
import { validate } from "../middlewares/validate";
import { validateObjectIdParam } from "../middlewares/validateObjectIdParam";
import { validateQuery } from "../middlewares/validateQuery";
import { asyncHandler } from "../utils/asyncHandler";
import { createTaskSchema, listTasksQuerySchema, updateTaskSchema } from "../validators/task.validator";

export const taskRouter = Router();

taskRouter.use(authenticate);

taskRouter.get("/", validateQuery(listTasksQuerySchema), asyncHandler(taskController.list));
taskRouter.get("/:id", validateObjectIdParam(), asyncHandler(taskController.getById));
taskRouter.post("/", validate(createTaskSchema), asyncHandler(taskController.create));
taskRouter.patch(
  "/:id",
  validateObjectIdParam(),
  validate(updateTaskSchema),
  asyncHandler(taskController.update),
);
taskRouter.delete("/:id", validateObjectIdParam(), asyncHandler(taskController.remove));
