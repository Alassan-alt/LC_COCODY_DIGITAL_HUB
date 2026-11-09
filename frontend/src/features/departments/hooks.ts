import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDepartment,
  deactivateDepartment,
  listDepartments,
  updateDepartment,
  type DepartmentInput,
  type ListDepartmentsParams,
} from "./api";

const QUERY_KEY = "departments";

export function useDepartments(params: ListDepartmentsParams) {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => listDepartments(params),
    placeholderData: (previous) => previous,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDepartment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<DepartmentInput> }) =>
      updateDepartment(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useDeactivateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deactivateDepartment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
