import { api } from "../../services/api";
import type { PaginatedResponse } from "../departments/api";

export interface Meeting {
  id: string;
  title: string;
  date: string;
  agenda: string | null;
  minutes: string | null;
  departmentId: string | null;
  mandateId: string | null;
  organizerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingDecision {
  id: string;
  description: string;
  dueDate: string | null;
  meetingId: string;
  responsibleId: string;
  generatedTaskId: string | null;
  createdAt: string;
}

export interface ListMeetingsParams {
  page?: number;
  search?: string;
  departmentId?: string;
  mandateId?: string;
}

export async function listMeetings(params: ListMeetingsParams): Promise<PaginatedResponse<Meeting>> {
  const { data } = await api.get<PaginatedResponse<Meeting>>("/meetings", { params });
  return data;
}

export interface MeetingInput {
  title: string;
  date: string;
  agenda?: string;
  departmentId?: string;
  mandateId?: string;
}

export async function createMeeting(input: MeetingInput): Promise<Meeting> {
  const { data } = await api.post<{ success: boolean; data: Meeting }>("/meetings", input);
  return data.data;
}

export interface UpdateMeetingInput {
  title?: string;
  date?: string;
  agenda?: string | null;
  minutes?: string | null;
}

export async function updateMeeting(id: string, input: UpdateMeetingInput): Promise<Meeting> {
  const { data } = await api.patch<{ success: boolean; data: Meeting }>(`/meetings/${id}`, input);
  return data.data;
}

export async function deleteMeeting(id: string): Promise<void> {
  await api.delete(`/meetings/${id}`);
}

export async function listDecisions(meetingId: string): Promise<MeetingDecision[]> {
  const { data } = await api.get<{ success: boolean; data: MeetingDecision[] }>(
    `/meetings/${meetingId}/decisions`,
  );
  return data.data;
}

export interface DecisionInput {
  description: string;
  responsibleId: string;
  dueDate?: string;
}

export async function createDecision(meetingId: string, input: DecisionInput): Promise<MeetingDecision> {
  const { data } = await api.post<{ success: boolean; data: MeetingDecision }>(
    `/meetings/${meetingId}/decisions`,
    input,
  );
  return data.data;
}
