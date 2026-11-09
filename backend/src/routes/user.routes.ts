import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validate } from "../middlewares/validate";
import { validateObjectIdParam } from "../middlewares/validateObjectIdParam";
import { validateQuery } from "../middlewares/validateQuery";
import { asyncHandler } from "../utils/asyncHandler";
import { createUserSchema, listUsersQuerySchema, updateUserSchema } from "../validators/user.validator";

export const userRouter = Router();

userRouter.use(authenticate);
userRouter.use(authorize("SUPER_ADMIN", "LCP"));

userRouter.get("/", validateQuery(listUsersQuerySchema), asyncHandler(userController.list));
userRouter.get("/:id", validateObjectIdParam(), asyncHandler(userController.getById));
userRouter.post(
  "/",
  authorize("SUPER_ADMIN"),
  validate(createUserSchema),
  asyncHandler(userController.create),
);
userRouter.patch(
  "/:id",
  authorize("SUPER_ADMIN"),
  validateObjectIdParam(),
  validate(updateUserSchema),
  asyncHandler(userController.update),
);
userRouter.delete(
  "/:id",
  authorize("SUPER_ADMIN"),
  validateObjectIdParam(),
  asyncHandler(userController.remove),
);
