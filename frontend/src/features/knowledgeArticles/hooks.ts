import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createKnowledgeArticle,
  deleteKnowledgeArticle,
  listKnowledgeArticles,
  updateKnowledgeArticle,
  type ListKnowledgeArticlesParams,
  type UpdateKnowledgeArticleInput,
} from "./api";

const QUERY_KEY = "knowledge-articles";

export function useKnowledgeArticles(params: ListKnowledgeArticlesParams) {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => listKnowledgeArticles(params),
    placeholderData: (previous) => previous,
  });
}

export function useCreateKnowledgeArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createKnowledgeArticle,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdateKnowledgeArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateKnowledgeArticleInput }) =>
      updateKnowledgeArticle(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useDeleteKnowledgeArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteKnowledgeArticle,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
