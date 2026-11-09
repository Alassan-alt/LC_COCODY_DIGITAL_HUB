import { Router } from "express";
import { lessonLearnedController } from "../controllers/lessonLearned.controller";
import { projectController } from "../controllers/project.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validate } from "../middlewares/validate";
import { validateObjectIdParam } from "../middlewares/validateObjectIdParam";
import { validateQuery } from "../middlewares/validateQuery";
import { asyncHandler } from "../utils/asyncHandler";
import { upsertLessonLearnedSchema } from "../validators/lessonLearned.validator";
import {
  createProjectSchema,
  listProjectsQuerySchema,
  updateProjectSchema,
} from "../validators/project.validator";

export const projectRouter = Router();

projectRouter.use(authenticate);

projectRouter.get("/", validateQuery(listProjectsQuerySchema), asyncHandler(projectController.list));
projectRouter.get("/:id", validateObjectIdParam(), asyncHandler(projectController.getById));
projectRouter.get("/:id/board", validateObjectIdParam(), asyncHandler(projectController.getBoard));
projectRouter.post(
  "/",
  authorize("SUPER_ADMIN", "LCP", "VP", "TEAM_LEADER"),
  validate(createProjectSchema),
  asyncHandler(projectController.create),
);
projectRouter.patch(
  "/:id",
  authorize("SUPER_ADMIN", "LCP", "VP", "TEAM_LEADER"),
  validateObjectIdParam(),
  validate(updateProjectSchema),
  asyncHandler(projectController.update),
);
projectRouter.delete(
  "/:id",
  authorize("SUPER_ADMIN", "LCP", "VP", "TEAM_LEADER"),
  validateObjectIdParam(),
  asyncHandler(projectController.remove),
);

// Phase 16 — Lessons Learned : une entrée par projet (upsert).
projectRouter.get(
  "/:id/lessons-learned",
  validateObjectIdParam(),
  asyncHandler(lessonLearnedController.getByProject),
);
projectRouter.put(
  "/:id/lessons-learned",
  authorize("SUPER_ADMIN", "LCP", "VP", "TEAM_LEADER"),
  validateObjectIdParam(),
  validate(upsertLessonLearnedSchema),
  asyncHandler(lessonLearnedController.upsert),
);
