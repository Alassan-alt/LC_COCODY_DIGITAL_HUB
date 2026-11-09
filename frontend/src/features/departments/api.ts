import { api } from "../../services/api";

export interface Department {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  items: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface ListDepartmentsParams {
  page?: number;
  search?: string;
  limit?: number;
}

export async function listDepartments(params: ListDepartmentsParams): Promise<PaginatedResponse<Department>> {
  const { data } = await api.get<PaginatedResponse<Department>>("/departments", { params });
  return data;
}

export interface DepartmentInput {
  name: string;
  description?: string;
}

export async function createDepartment(input: DepartmentInput): Promise<Department> {
  const { data } = await api.post<{ success: boolean; data: Department }>("/departments", input);
  return data.data;
}

export async function updateDepartment(id: string, input: Partial<DepartmentInput>): Promise<Department> {
  const { data } = await api.patch<{ success: boolean; data: Department }>(`/departments/${id}`, input);
  return data.data;
}

export async function deactivateDepartment(id: string): Promise<Department> {
  const { data } = await api.delete<{ success: boolean; data: Department }>(`/departments/${id}`);
  return data.data;
}
