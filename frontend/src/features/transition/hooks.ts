import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addChecklistItem,
  createTransitionPackage,
  deleteChecklistItem,
  getTransitionContent,
  listChecklist,
  listTransitionPackages,
  updateChecklistItem,
  updateTransitionPackage,
  type ListTransitionPackagesParams,
  type TransitionPackageInput,
  type UpdateTransitionPackageInput,
} from "./api";

const QUERY_KEY = "transition-packages";
const CHECKLIST_KEY = "transition-checklist";
const CONTENT_KEY = "transition-content";

export function useTransitionPackages(params: ListTransitionPackagesParams) {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => listTransitionPackages(params),
    placeholderData: (previous) => previous,
  });
}

export function useTransitionContent(id: string | null) {
  return useQuery({
    queryKey: [CONTENT_KEY, id],
    queryFn: () => getTransitionContent(id as string),
    enabled: id !== null,
  });
}

export function useChecklist(id: string | null) {
  return useQuery({
    queryKey: [CHECKLIST_KEY, id],
    queryFn: () => listChecklist(id as string),
    enabled: id !== null,
  });
}

export function useCreateTransitionPackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TransitionPackageInput) => createTransitionPackage(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdateTransitionPackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTransitionPackageInput }) =>
      updateTransitionPackage(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useAddChecklistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, label }: { id: string; label: string }) => addChecklistItem(id, label),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: [CHECKLIST_KEY, variables.id] }),
  });
}

export function useUpdateChecklistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      itemId,
      input,
    }: {
      id: string;
      itemId: string;
      input: { label?: string; isDone?: boolean };
    }) => updateChecklistItem(id, itemId, input),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: [CHECKLIST_KEY, variables.id] }),
  });
}

export function useDeleteChecklistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, itemId }: { id: string; itemId: string }) => deleteChecklistItem(id, itemId),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: [CHECKLIST_KEY, variables.id] }),
  });
}
