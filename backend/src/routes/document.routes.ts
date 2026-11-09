import { Router } from "express";
import { documentController } from "../controllers/document.controller";
import { authenticate } from "../middlewares/authenticate";
import { upload } from "../middlewares/upload";
import { validate } from "../middlewares/validate";
import { validateObjectIdParam } from "../middlewares/validateObjectIdParam";
import { validateQuery } from "../middlewares/validateQuery";
import { asyncHandler } from "../utils/asyncHandler";
import {
  listDocumentsQuerySchema,
  newVersionSchema,
  updateDocumentSchema,
  uploadDocumentSchema,
} from "../validators/document.validator";

export const documentRouter = Router();

documentRouter.use(authenticate);

documentRouter.get("/", validateQuery(listDocumentsQuerySchema), asyncHandler(documentController.list));

documentRouter.post(
  "/",
  upload.single("file"),
  validate(uploadDocumentSchema),
  asyncHandler(documentController.upload),
);

documentRouter.get("/:id", validateObjectIdParam(), asyncHandler(documentController.getById));
documentRouter.patch(
  "/:id",
  validateObjectIdParam(),
  validate(updateDocumentSchema),
  asyncHandler(documentController.update),
);
documentRouter.delete("/:id", validateObjectIdParam(), asyncHandler(documentController.remove));

documentRouter.get("/:id/download", validateObjectIdParam(), asyncHandler(documentController.download));

documentRouter.get("/:id/versions", validateObjectIdParam(), asyncHandler(documentController.listVersions));
documentRouter.post(
  "/:id/versions",
  validateObjectIdParam(),
  upload.single("file"),
  validate(newVersionSchema),
  asyncHandler(documentController.addVersion),
);
documentRouter.get(
  "/:id/versions/:versionId/download",
  validateObjectIdParam(),
  validateObjectIdParam("versionId"),
  asyncHandler(documentController.downloadVersion),
);
documentRouter.post(
  "/:id/versions/:versionId/restore",
  validateObjectIdParam(),
  validateObjectIdParam("versionId"),
  asyncHandler(documentController.restoreVersion),
);
