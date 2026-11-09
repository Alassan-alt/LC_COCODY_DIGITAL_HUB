import { api } from "../../services/api";
import type { PaginatedResponse } from "../departments/api";

export interface Team {
  id: string;
  name: string;
  departmentId: string;
  mandateId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListTeamsParams {
  page?: number;
  search?: string;
  departmentId?: string;
  mandateId?: string;
}

export async function listTeams(params: ListTeamsParams): Promise<PaginatedResponse<Team>> {
  const { data } = await api.get<PaginatedResponse<Team>>("/teams", { params });
  return data;
}

export interface TeamInput {
  name: string;
  departmentId: string;
  mandateId: string;
}

export async function createTeam(input: TeamInput): Promise<Team> {
  const { data } = await api.post<{ success: boolean; data: Team }>("/teams", input);
  return data.data;
}

export async function updateTeam(id: string, input: Partial<TeamInput>): Promise<Team> {
  const { data } = await api.patch<{ success: boolean; data: Team }>(`/teams/${id}`, input);
  return data.data;
}

export async function deleteTeam(id: string): Promise<void> {
  await api.delete(`/teams/${id}`);
}
