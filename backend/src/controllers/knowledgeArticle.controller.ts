import type { Request, Response } from "express";
import { knowledgeArticleService } from "../services/knowledgeArticle.service";
import { resolveAccessContext } from "../utils/requestContext";
import type {
  CreateKnowledgeArticleInput,
  ListKnowledgeArticlesQuery,
  UpdateKnowledgeArticleInput,
} from "../validators/knowledgeArticle.validator";

export const knowledgeArticleController = {
  async list(req: Request, res: Response): Promise<void> {
    const ctx = await resolveAccessContext(req.user!);
    const result = await knowledgeArticleService.list(req.query as unknown as ListKnowledgeArticlesQuery, ctx);
    res.status(200).json({ success: true, ...result });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const ctx = await resolveAccessContext(req.user!);
    const article = await knowledgeArticleService.getById(req.params.id, ctx);
    res.status(200).json({ success: true, data: article });
  },

  async create(req: Request, res: Response): Promise<void> {
    const article = await knowledgeArticleService.create(
      req.body as CreateKnowledgeArticleInput,
      req.user!.sub,
    );
    res.status(201).json({ success: true, data: article });
  },

  async update(req: Request, res: Response): Promise<void> {
    const ctx = await resolveAccessContext(req.user!);
    const article = await knowledgeArticleService.update(
      req.params.id,
      req.body as UpdateKnowledgeArticleInput,
      ctx,
    );
    res.status(200).json({ success: true, data: article });
  },

  async remove(req: Request, res: Response): Promise<void> {
    const ctx = await resolveAccessContext(req.user!);
    await knowledgeArticleService.remove(req.params.id, ctx);
    res.status(200).json({ success: true, message: "Article supprimé" });
  },
};
