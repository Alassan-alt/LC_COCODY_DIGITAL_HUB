import { api } from "../../services/api";
import type { PaginatedResponse } from "../departments/api";

export type Role = "SUPER_ADMIN" | "LCP" | "VP" | "TEAM_LEADER" | "MEMBER";

export interface User {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  memberProfile: { id: string; firstName: string; lastName: string } | null;
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: Role;
  isActive?: boolean;
}

export async function listUsers(params: ListUsersParams): Promise<PaginatedResponse<User>> {
  const { data } = await api.get<PaginatedResponse<User>>("/users", { params });
  return data;
}

export interface CreateUserInput {
  email: string;
  password: string;
  role: Role;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const { data } = await api.post<{ success: boolean; data: User }>("/users", input);
  return data.data;
}

export interface UpdateUserInput {
  role?: Role;
  isActive?: boolean;
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<User> {
  const { data } = await api.patch<{ success: boolean; data: User }>(`/users/${id}`, input);
  return data.data;
}

export async function deactivateUser(id: string): Promise<User> {
  const { data } = await api.delete<{ success: boolean; data: User }>(`/users/${id}`);
  return data.data;
}
