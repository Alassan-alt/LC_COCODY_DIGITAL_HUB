import { api } from "../../services/api";
import type { PaginatedResponse } from "../departments/api";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE" | "OVERDUE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  projectId: string | null;
  assigneeId: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListTasksParams {
  page?: number;
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId?: string;
  assigneeId?: string;
}

export async function listTasks(params: ListTasksParams): Promise<PaginatedResponse<Task>> {
  const { data } = await api.get<PaginatedResponse<Task>>("/tasks", { params });
  return data;
}

export interface TaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  projectId?: string;
  assigneeId?: string;
}

export async function createTask(input: TaskInput): Promise<Task> {
  const { data } = await api.post<{ success: boolean; data: Task }>("/tasks", input);
  return data.data;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  projectId?: string | null;
  assigneeId?: string | null;
}

export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
  const { data } = await api.patch<{ success: boolean; data: Task }>(`/tasks/${id}`, input);
  return data.data;
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete(`/tasks/${id}`);
}
