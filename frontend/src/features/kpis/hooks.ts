import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createKpi,
  deleteKpi,
  listKpis,
  updateKpi,
  type KpiInput,
  type ListKpisParams,
} from "./api";

const QUERY_KEY = "kpis";

export function useKpis(params: ListKpisParams) {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => listKpis(params),
    placeholderData: (previous) => previous,
  });
}

export function useCreateKpi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createKpi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdateKpi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<KpiInput> }) => updateKpi(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useDeleteKpi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteKpi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
