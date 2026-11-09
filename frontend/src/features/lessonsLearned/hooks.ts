import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getLessonLearned, upsertLessonLearned, type LessonLearnedInput } from "./api";

const QUERY_KEY = "lesson-learned";

export function useLessonLearned(projectId: string | null) {
  return useQuery({
    queryKey: [QUERY_KEY, projectId],
    queryFn: () => getLessonLearned(projectId as string),
    enabled: projectId !== null,
  });
}

export function useUpsertLessonLearned() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, input }: { projectId: string; input: LessonLearnedInput }) =>
      upsertLessonLearned(projectId, input),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.projectId] }),
  });
}
