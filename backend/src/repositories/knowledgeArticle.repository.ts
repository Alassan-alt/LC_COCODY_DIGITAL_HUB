import type { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

export const knowledgeArticleRepository = {
  async findMany(params: {
    skip: number;
    take: number;
    search?: string;
    category?: string;
    tag?: string;
    visibilityWhere?: Record<string, unknown>;
  }) {
    const baseWhere: Prisma.KnowledgeArticleWhereInput = {
      ...(params.search
        ? {
            OR: [
              { title: { contains: params.search, mode: "insensitive" } },
              { content: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(params.category ? { category: params.category } : {}),
      ...(params.tag ? { tags: { has: params.tag } } : {}),
    };

    const where: Prisma.KnowledgeArticleWhereInput = params.visibilityWhere
      ? { AND: [baseWhere, params.visibilityWhere as Prisma.KnowledgeArticleWhereInput] }
      : baseWhere;

    const [items, total] = await Promise.all([
      prisma.knowledgeArticle.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.knowledgeArticle.count({ where }),
    ]);

    return { items, total };
  },

  findById(id: string) {
    return prisma.knowledgeArticle.findUnique({ where: { id } });
  },

  create(data: {
    title: string;
    content: string;
    category?: string;
    tags: string[];
    visibility: Prisma.KnowledgeArticleCreateInput["visibility"];
    authorId: string;
  }) {
    return prisma.knowledgeArticle.create({ data });
  },

  update(id: string, data: Prisma.KnowledgeArticleUpdateInput) {
    return prisma.knowledgeArticle.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.knowledgeArticle.delete({ where: { id } });
  },
};
