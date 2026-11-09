import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProject,
  deleteProject,
  getProject,
  getProjectBoard,
  listProjects,
  updateProject,
  type ListProjectsParams,
  type ProjectInput,
} from "./api";

const QUERY_KEY = "projects";
const BOARD_KEY = "project-board";

export function useProjects(params: ListProjectsParams) {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => listProjects(params),
    placeholderData: (previous) => previous,
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => getProject(id as string),
    enabled: id !== undefined,
  });
}

export function useProjectBoard(projectId: string | null) {
  return useQuery({
    queryKey: [BOARD_KEY, projectId],
    queryFn: () => getProjectBoard(projectId as string),
    enabled: projectId !== null,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ProjectInput> }) => updateProject(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
