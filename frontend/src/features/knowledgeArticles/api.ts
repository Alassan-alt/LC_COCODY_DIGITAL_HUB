import { api } from "../../services/api";
import type { PaginatedResponse } from "../departments/api";
import type { Visibility } from "../folders/api";

export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string | null;
  tags: string[];
  visibility: Visibility;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListKnowledgeArticlesParams {
  page?: number;
  search?: string;
  category?: string;
  tag?: string;
}

export async function listKnowledgeArticles(
  params: ListKnowledgeArticlesParams,
): Promise<PaginatedResponse<KnowledgeArticle>> {
  const { data } = await api.get<PaginatedResponse<KnowledgeArticle>>("/knowledge-articles", { params });
  return data;
}

export interface KnowledgeArticleInput {
  title: string;
  content: string;
  category?: string;
  tags?: string;
  visibility: Visibility;
}

export async function createKnowledgeArticle(input: KnowledgeArticleInput): Promise<KnowledgeArticle> {
  const { data } = await api.post<{ success: boolean; data: KnowledgeArticle }>(
    "/knowledge-articles",
    input,
  );
  return data.data;
}

export interface UpdateKnowledgeArticleInput {
  title?: string;
  content?: string;
  category?: string | null;
  tags?: string[];
  visibility?: Visibility;
}

export async function updateKnowledgeArticle(
  id: string,
  input: UpdateKnowledgeArticleInput,
): Promise<KnowledgeArticle> {
  const { data } = await api.patch<{ success: boolean; data: KnowledgeArticle }>(
    `/knowledge-articles/${id}`,
    input,
  );
  return data.data;
}

export async function deleteKnowledgeArticle(id: string): Promise<void> {
  await api.delete(`/knowledge-articles/${id}`);
}
