import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createEvent,
  deleteEvent,
  listAttendances,
  listEvents,
  markAttendance,
  updateEvent,
  type AttendanceStatus,
  type EventInput,
  type ListEventsParams,
} from "./api";

const QUERY_KEY = "events";
const ATTENDANCES_KEY = "event-attendances";

export function useEvents(params: ListEventsParams) {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => listEvents(params),
    placeholderData: (previous) => previous,
  });
}

export function useAttendances(eventId: string | null) {
  return useQuery({
    queryKey: [ATTENDANCES_KEY, eventId],
    queryFn: () => listAttendances(eventId as string),
    enabled: eventId !== null,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEvent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<EventInput> }) => updateEvent(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useMarkAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      userId,
      status,
    }: {
      eventId: string;
      userId?: string;
      status: AttendanceStatus;
    }) => markAttendance(eventId, { userId, status }),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: [ATTENDANCES_KEY, variables.eventId] }),
  });
}
