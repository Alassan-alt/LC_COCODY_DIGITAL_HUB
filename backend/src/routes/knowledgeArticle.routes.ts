import { Router } from "express";
import { knowledgeArticleController } from "../controllers/knowledgeArticle.controller";
import { authenticate } from "../middlewares/authenticate";
import { validate } from "../middlewares/validate";
import { validateObjectIdParam } from "../middlewares/validateObjectIdParam";
import { validateQuery } from "../middlewares/validateQuery";
import { asyncHandler } from "../utils/asyncHandler";
import {
  createKnowledgeArticleSchema,
  listKnowledgeArticlesQuerySchema,
  updateKnowledgeArticleSchema,
} from "../validators/knowledgeArticle.validator";

export const knowledgeArticleRouter = Router();

knowledgeArticleRouter.use(authenticate);

knowledgeArticleRouter.get(
  "/",
  validateQuery(listKnowledgeArticlesQuerySchema),
  asyncHandler(knowledgeArticleController.list),
);
knowledgeArticleRouter.get("/:id", validateObjectIdParam(), asyncHandler(knowledgeArticleController.getById));
knowledgeArticleRouter.post(
  "/",
  validate(createKnowledgeArticleSchema),
  asyncHandler(knowledgeArticleController.create),
);
knowledgeArticleRouter.patch(
  "/:id",
  validateObjectIdParam(),
  validate(updateKnowledgeArticleSchema),
  asyncHandler(knowledgeArticleController.update),
);
knowledgeArticleRouter.delete(
  "/:id",
  validateObjectIdParam(),
  asyncHandler(knowledgeArticleController.remove),
);
