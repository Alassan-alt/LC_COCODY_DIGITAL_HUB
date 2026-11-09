import { api } from "../../services/api";
import type { PaginatedResponse } from "../departments/api";
import type { Role } from "../users/api";

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  position: string | null;
  joinedAt: string;
  userId: string;
  departmentId: string | null;
  teamId: string | null;
  mandateId: string | null;
  user: { id: string; email: string; role: Role; isActive: boolean };
}

export interface ListMembersParams {
  page?: number;
  search?: string;
  departmentId?: string;
  teamId?: string;
  mandateId?: string;
}

export async function listMembers(params: ListMembersParams): Promise<PaginatedResponse<Member>> {
  const { data } = await api.get<PaginatedResponse<Member>>("/members", { params });
  return data;
}

export interface MemberInput {
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  position?: string;
  departmentId?: string;
  teamId?: string;
  mandateId?: string;
}

export async function createMember(input: MemberInput): Promise<Member> {
  const { data } = await api.post<{ success: boolean; data: Member }>("/members", input);
  return data.data;
}

export interface UpdateMemberInput {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  position?: string | null;
  departmentId?: string | null;
  teamId?: string | null;
  mandateId?: string | null;
}

export async function updateMember(id: string, input: UpdateMemberInput): Promise<Member> {
  const { data } = await api.patch<{ success: boolean; data: Member }>(`/members/${id}`, input);
  return data.data;
}

export async function deactivateMember(id: string): Promise<Member> {
  const { data } = await api.delete<{ success: boolean; data: Member }>(`/members/${id}`);
  return data.data;
}
