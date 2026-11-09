import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createReport,
  deleteReport,
  generateReport,
  listReports,
  updateReport,
  type CreateReportInput,
  type GenerateReportInput,
  type ListReportsParams,
  type UpdateReportInput,
} from "./api";

const QUERY_KEY = "reports";

export function useReports(params: ListReportsParams) {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => listReports(params),
    placeholderData: (previous) => previous,
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReportInput) => createReport(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useGenerateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GenerateReportInput) => generateReport(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateReportInput }) => updateReport(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteReport,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
