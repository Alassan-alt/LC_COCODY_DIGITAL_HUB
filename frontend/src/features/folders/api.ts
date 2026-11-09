import { api } from "../../services/api";
import type { PaginatedResponse } from "../departments/api";

export type Visibility = "PUBLIC" | "INTERNAL" | "DEPARTMENT" | "CONFIDENTIAL" | "RESTRICTED";

export interface Folder {
  id: string;
  name: string;
  visibility: Visibility;
  parentFolderId: string | null;
  departmentId: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListFoldersParams {
  page?: number;
  limit?: number;
  search?: string;
  parentFolderId?: string;
  departmentId?: string;
}

export async function listFolders(params: ListFoldersParams): Promise<PaginatedResponse<Folder>> {
  const { data } = await api.get<PaginatedResponse<Folder>>("/folders", { params });
  return data;
}

export interface FolderInput {
  name: string;
  visibility: Visibility;
  parentFolderId?: string;
  departmentId?: string;
}

export async function createFolder(input: FolderInput): Promise<Folder> {
  const { data } = await api.post<{ success: boolean; data: Folder }>("/folders", input);
  return data.data;
}

export async function updateFolder(id: string, input: Partial<FolderInput>): Promise<Folder> {
  const { data } = await api.patch<{ success: boolean; data: Folder }>(`/folders/${id}`, input);
  return data.data;
}

export async function deleteFolder(id: string): Promise<void> {
  await api.delete(`/folders/${id}`);
}
