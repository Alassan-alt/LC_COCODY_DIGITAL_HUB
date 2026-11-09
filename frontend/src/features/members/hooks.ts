import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createMember,
  deactivateMember,
  listMembers,
  updateMember,
  type ListMembersParams,
  type UpdateMemberInput,
} from "./api";

const QUERY_KEY = "members";

export function useMembers(params: ListMembersParams) {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => listMembers(params),
    placeholderData: (previous) => previous,
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateMemberInput }) => updateMember(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useDeactivateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deactivateMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
