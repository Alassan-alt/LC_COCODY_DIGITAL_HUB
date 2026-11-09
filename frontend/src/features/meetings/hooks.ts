import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDecision,
  createMeeting,
  deleteMeeting,
  listDecisions,
  listMeetings,
  updateMeeting,
  type DecisionInput,
  type ListMeetingsParams,
  type UpdateMeetingInput,
} from "./api";

const QUERY_KEY = "meetings";
const DECISIONS_KEY = "meeting-decisions";

export function useMeetings(params: ListMeetingsParams) {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => listMeetings(params),
    placeholderData: (previous) => previous,
  });
}

export function useDecisions(meetingId: string | null) {
  return useQuery({
    queryKey: [DECISIONS_KEY, meetingId],
    queryFn: () => listDecisions(meetingId as string),
    enabled: meetingId !== null,
  });
}

export function useCreateMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMeeting,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdateMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateMeetingInput }) => updateMeeting(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useDeleteMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMeeting,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useCreateDecision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ meetingId, input }: { meetingId: string; input: DecisionInput }) =>
      createDecision(meetingId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [DECISIONS_KEY, variables.meetingId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
