import { Router } from "express";
import { departmentController } from "../controllers/department.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validate } from "../middlewares/validate";
import { validateObjectIdParam } from "../middlewares/validateObjectIdParam";
import { validateQuery } from "../middlewares/validateQuery";
import { asyncHandler } from "../utils/asyncHandler";
import {
  createDepartmentSchema,
  listDepartmentsQuerySchema,
  updateDepartmentSchema,
} from "../validators/department.validator";

export const departmentRouter = Router();

departmentRouter.use(authenticate);

departmentRouter.get("/", validateQuery(listDepartmentsQuerySchema), asyncHandler(departmentController.list));
departmentRouter.get("/:id", validateObjectIdParam(), asyncHandler(departmentController.getById));
departmentRouter.post(
  "/",
  authorize("SUPER_ADMIN", "LCP"),
  validate(createDepartmentSchema),
  asyncHandler(departmentController.create),
);
departmentRouter.patch(
  "/:id",
  authorize("SUPER_ADMIN", "LCP"),
  validateObjectIdParam(),
  validate(updateDepartmentSchema),
  asyncHandler(departmentController.update),
);
departmentRouter.delete(
  "/:id",
  authorize("SUPER_ADMIN", "LCP"),
  validateObjectIdParam(),
  asyncHandler(departmentController.remove),
);
