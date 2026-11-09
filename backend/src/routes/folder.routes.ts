import { Router } from "express";
import { folderController } from "../controllers/folder.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validate } from "../middlewares/validate";
import { validateObjectIdParam } from "../middlewares/validateObjectIdParam";
import { validateQuery } from "../middlewares/validateQuery";
import { asyncHandler } from "../utils/asyncHandler";
import {
  createFolderSchema,
  listFoldersQuerySchema,
  updateFolderSchema,
} from "../validators/folder.validator";

export const folderRouter = Router();

folderRouter.use(authenticate);

folderRouter.get("/", validateQuery(listFoldersQuerySchema), asyncHandler(folderController.list));
folderRouter.get("/:id", validateObjectIdParam(), asyncHandler(folderController.getById));
folderRouter.post(
  "/",
  authorize("SUPER_ADMIN", "LCP", "VP", "TEAM_LEADER"),
  validate(createFolderSchema),
  asyncHandler(folderController.create),
);
folderRouter.patch(
  "/:id",
  authorize("SUPER_ADMIN", "LCP", "VP", "TEAM_LEADER"),
  validateObjectIdParam(),
  validate(updateFolderSchema),
  asyncHandler(folderController.update),
);
folderRouter.delete(
  "/:id",
  authorize("SUPER_ADMIN", "LCP", "VP", "TEAM_LEADER"),
  validateObjectIdParam(),
  asyncHandler(folderController.remove),
);
