import { z } from "zod";
import { paginationQuerySchema } from "./common.validator";

const visibilitySchema = z.enum(["PUBLIC", "INTERNAL", "DEPARTMENT", "CONFIDENTIAL", "RESTRICTED"]);

const tagsField = z
  .union([z.array(z.string()), z.string()])
  .optional()
  .transform((value): string[] => {
    if (!value) return [];
    const list = Array.isArray(value) ? value : value.split(",");
    return list.map((tag) => tag.trim()).filter(Boolean);
  });

export const createKnowledgeArticleSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis"),
  content: z.string().trim().min(1, "Le contenu est requis"),
  category: z.string().trim().min(1).optional(),
  tags: tagsField,
  visibility: visibilitySchema.default("INTERNAL"),
});

export const updateKnowledgeArticleSchema = z.object({
  title: z.string().trim().min(1).optional(),
  content: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).nullable().optional(),
  tags: z.array(z.string()).optional(),
  visibility: visibilitySchema.optional(),
});

export const listKnowledgeArticlesQuerySchema = paginationQuerySchema.extend({
  category: z.string().trim().min(1).optional(),
  tag: z.string().trim().min(1).optional(),
});

export type CreateKnowledgeArticleInput = z.infer<typeof createKnowledgeArticleSchema>;
export type UpdateKnowledgeArticleInput = z.infer<typeof updateKnowledgeArticleSchema>;
export type ListKnowledgeArticlesQuery = z.infer<typeof listKnowledgeArticlesQuerySchema>;
