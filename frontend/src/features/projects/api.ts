import { api } from "../../services/api";
import type { PaginatedResponse } from "../departments/api";
import type { Task } from "../tasks/api";

export type ProjectStatus = "PLANNED" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  departmentId: string | null;
  mandateId: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListProjectsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProjectStatus;
  departmentId?: string;
  mandateId?: string;
}

export async function listProjects(params: ListProjectsParams): Promise<PaginatedResponse<Project>> {
  const { data } = await api.get<PaginatedResponse<Project>>("/projects", { params });
  return data;
}

export async function getProject(id: string): Promise<Project> {
  const { data } = await api.get<{ success: boolean; data: Project }>(`/projects/${id}`);
  return data.data;
}

export interface ProjectInput {
  name: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  mandateId?: string;
}

export async function createProject(input: ProjectInput): Promise<Project> {
  const { data } = await api.post<{ success: boolean; data: Project }>("/projects", input);
  return data.data;
}

export async function updateProject(id: string, input: Partial<ProjectInput>): Promise<Project> {
  const { data } = await api.patch<{ success: boolean; data: Project }>(`/projects/${id}`, input);
  return data.data;
}

export async function deleteProject(id: string): Promise<void> {
  await api.delete(`/projects/${id}`);
}

export type ProjectBoard = Record<"TODO" | "IN_PROGRESS" | "DONE" | "OVERDUE", Task[]>;

export async function getProjectBoard(id: string): Promise<ProjectBoard> {
  const { data } = await api.get<{ success: boolean; data: ProjectBoard }>(`/projects/${id}/board`);
  return data.data;
}
