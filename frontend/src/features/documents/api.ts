import { api } from "../../services/api";
import type { PaginatedResponse } from "../departments/api";
import type { Visibility } from "../folders/api";

export interface Document {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  tags: string[];
  visibility: Visibility;
  currentVersionId: string | null;
  folderId: string | null;
  authorId: string;
  departmentId: string | null;
  mandateId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersion {
  id: string;
  versionNumber: number;
  originalName: string;
  mimeType: string;
  size: number;
  changeNote: string | null;
  documentId: string;
  uploadedById: string;
  createdAt: string;
}

export interface ListDocumentsParams {
  page?: number;
  limit?: number;
  search?: string;
  folderId?: string;
  departmentId?: string;
  mandateId?: string;
  category?: string;
  tag?: string;
  visibility?: Visibility;
}

export async function listDocuments(params: ListDocumentsParams): Promise<PaginatedResponse<Document>> {
  const { data } = await api.get<PaginatedResponse<Document>>("/documents", { params });
  return data;
}

export interface UploadDocumentInput {
  file: File;
  name: string;
  description?: string;
  category?: string;
  tags?: string;
  visibility: Visibility;
  folderId?: string;
  departmentId?: string;
  mandateId?: string;
}

function toFormData(input: UploadDocumentInput): FormData {
  const formData = new FormData();
  formData.append("file", input.file);
  formData.append("name", input.name);
  formData.append("visibility", input.visibility);
  if (input.description) formData.append("description", input.description);
  if (input.category) formData.append("category", input.category);
  if (input.tags) formData.append("tags", input.tags);
  if (input.folderId) formData.append("folderId", input.folderId);
  if (input.departmentId) formData.append("departmentId", input.departmentId);
  if (input.mandateId) formData.append("mandateId", input.mandateId);
  return formData;
}

export async function uploadDocument(input: UploadDocumentInput): Promise<Document> {
  const { data } = await api.post<{ success: boolean; data: Document }>(
    "/documents",
    toFormData(input),
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data.data;
}

export interface UpdateDocumentInput {
  name?: string;
  description?: string | null;
  category?: string | null;
  tags?: string[];
  visibility?: Visibility;
  folderId?: string | null;
}

export async function updateDocument(id: string, input: UpdateDocumentInput): Promise<Document> {
  const { data } = await api.patch<{ success: boolean; data: Document }>(`/documents/${id}`, input);
  return data.data;
}

export async function deleteDocument(id: string): Promise<void> {
  await api.delete(`/documents/${id}`);
}

export async function downloadDocument(id: string): Promise<Blob> {
  const { data } = await api.get(`/documents/${id}/download`, { responseType: "blob" });
  return data;
}

export async function listDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
  const { data } = await api.get<{ success: boolean; data: DocumentVersion[] }>(
    `/documents/${documentId}/versions`,
  );
  return data.data;
}

export async function addDocumentVersion(
  documentId: string,
  file: File,
  changeNote?: string,
): Promise<Document> {
  const formData = new FormData();
  formData.append("file", file);
  if (changeNote) formData.append("changeNote", changeNote);
  const { data } = await api.post<{ success: boolean; data: Document }>(
    `/documents/${documentId}/versions`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data.data;
}

export async function downloadDocumentVersion(documentId: string, versionId: string): Promise<Blob> {
  const { data } = await api.get(`/documents/${documentId}/versions/${versionId}/download`, {
    responseType: "blob",
  });
  return data;
}

export async function restoreDocumentVersion(documentId: string, versionId: string): Promise<Document> {
  const { data } = await api.post<{ success: boolean; data: Document }>(
    `/documents/${documentId}/versions/${versionId}/restore`,
  );
  return data.data;
}
