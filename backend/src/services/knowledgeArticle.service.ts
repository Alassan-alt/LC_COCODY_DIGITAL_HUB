import { knowledgeArticleRepository } from "../repositories/knowledgeArticle.repository";
import { AppError } from "../utils/AppError";
import { buildVisibilityWhere, canAccess, type AccessContext } from "../utils/documentAccess";
import { buildPaginatedResult } from "../utils/pagination";
import type {
  CreateKnowledgeArticleInput,
  ListKnowledgeArticlesQuery,
  UpdateKnowledgeArticleInput,
} from "../validators/knowledgeArticle.validator";

interface ArticleSubject {
  visibility: string;
  authorId: string;
}

// La base de connaissances n'est pas rattachée à un département : DEPARTMENT/
// CONFIDENTIAL se comportent comme RESTRICTED (repli sûr, pas d'accès élargi
// accidentel) — voir ARCHITECTURE_DECISIONS.md (Phase 15).
function toAccessSubject(article: ArticleSubject) {
  return { visibility: article.visibility, departmentId: null, ownerId: article.authorId } as Parameters<
    typeof canAccess
  >[0];
}

function canModify(article: ArticleSubject, ctx: AccessContext): boolean {
  return ctx.role === "SUPER_ADMIN" || ctx.role === "LCP" || article.authorId === ctx.userId;
}

export const knowledgeArticleService = {
  async list(query: ListKnowledgeArticlesQuery, ctx: AccessContext) {
    const skip = (query.page - 1) * query.limit;
    const { items, total } = await knowledgeArticleRepository.findMany({
      skip,
      take: query.limit,
      search: query.search,
      category: query.category,
      tag: query.tag,
      visibilityWhere: buildVisibilityWhere(ctx, "authorId"),
    });
    return buildPaginatedResult(items, total, query.page, query.limit);
  },

  async getById(id: string, ctx: AccessContext) {
    const article = await knowledgeArticleRepository.findById(id);
    if (!article) {
      throw new AppError("Article introuvable", 404);
    }
    if (!canAccess(toAccessSubject(article), ctx)) {
      throw new AppError("Accès refusé à cet article", 403);
    }
    return article;
  },

  async create(input: CreateKnowledgeArticleInput, authorId: string) {
    return knowledgeArticleRepository.create({ ...input, authorId });
  },

  async update(id: string, input: UpdateKnowledgeArticleInput, ctx: AccessContext) {
    const article = await this.getById(id, ctx);
    if (!canModify(article, ctx)) {
      throw new AppError("Seul l'auteur ou un administrateur peut modifier cet article", 403);
    }
    return knowledgeArticleRepository.update(id, input);
  },

  async remove(id: string, ctx: AccessContext) {
    const article = await this.getById(id, ctx);
    if (!canModify(article, ctx)) {
      throw new AppError("Seul l'auteur ou un administrateur peut supprimer cet article", 403);
    }
    await knowledgeArticleRepository.delete(id);
  },
};
