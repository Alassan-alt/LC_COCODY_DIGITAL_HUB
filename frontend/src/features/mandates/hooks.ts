import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  closeMandate,
  createMandate,
  listMandates,
  updateMandate,
  type ListMandatesParams,
  type MandateInput,
} from "./api";

const QUERY_KEY = "mandates";

export function useMandates(params: ListMandatesParams) {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => listMandates(params),
    placeholderData: (previous) => previous,
  });
}

export function useCreateMandate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMandate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdateMandate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<MandateInput> }) =>
      updateMandate(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useCloseMandate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: closeMandate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
