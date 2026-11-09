import { api } from "../../services/api";
import type { PaginatedResponse } from "../departments/api";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "EXCUSED";

export interface Event {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  location: string | null;
  departmentId: string | null;
  mandateId: string | null;
  organizerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: string;
  status: AttendanceStatus;
  eventId: string;
  userId: string;
  checkedInAt: string;
}

export interface ListEventsParams {
  page?: number;
  search?: string;
  departmentId?: string;
  mandateId?: string;
}

export async function listEvents(params: ListEventsParams): Promise<PaginatedResponse<Event>> {
  const { data } = await api.get<PaginatedResponse<Event>>("/events", { params });
  return data;
}

export interface EventInput {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  departmentId?: string;
  mandateId?: string;
}

export async function createEvent(input: EventInput): Promise<Event> {
  const { data } = await api.post<{ success: boolean; data: Event }>("/events", input);
  return data.data;
}

export async function updateEvent(id: string, input: Partial<EventInput>): Promise<Event> {
  const { data } = await api.patch<{ success: boolean; data: Event }>(`/events/${id}`, input);
  return data.data;
}

export async function deleteEvent(id: string): Promise<void> {
  await api.delete(`/events/${id}`);
}

export async function listAttendances(eventId: string): Promise<Attendance[]> {
  const { data } = await api.get<{ success: boolean; data: Attendance[] }>(`/events/${eventId}/attendances`);
  return data.data;
}

export async function markAttendance(
  eventId: string,
  input: { userId?: string; status: AttendanceStatus },
): Promise<Attendance> {
  const { data } = await api.post<{ success: boolean; data: Attendance }>(
    `/events/${eventId}/attendances`,
    input,
  );
  return data.data;
}
