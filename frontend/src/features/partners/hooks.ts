import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addActivity,
  createPartner,
  deletePartner,
  listActivities,
  listPartners,
  updatePartner,
  type AddActivityInput,
  type ListPartnersParams,
  type PartnerInput,
} from "./api";

const QUERY_KEY = "partners";
const ACTIVITIES_KEY = "partner-activities";

export function usePartners(params: ListPartnersParams) {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => listPartners(params),
    placeholderData: (previous) => previous,
  });
}

export function usePartnerActivities(partnerId: string | null) {
  return useQuery({
    queryKey: [ACTIVITIES_KEY, partnerId],
    queryFn: () => listActivities(partnerId as string),
    enabled: partnerId !== null,
  });
}

export function useCreatePartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPartner,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdatePartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PartnerInput> }) => updatePartner(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useDeletePartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePartner,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useAddActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ partnerId, input }: { partnerId: string; input: AddActivityInput }) =>
      addActivity(partnerId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [ACTIVITIES_KEY, variables.partnerId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
