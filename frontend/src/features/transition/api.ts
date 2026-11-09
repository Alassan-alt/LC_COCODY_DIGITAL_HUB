import { api } from "../../services/api";
import type { PaginatedResponse } from "../departments/api";
import type { Document } from "../documents/api";
import type { Kpi } from "../kpis/api";
import type { Partner } from "../partners/api";
import type { Project } from "../projects/api";
import type { Report } from "../reports/api";
import type { KnowledgeArticle } from "../knowledgeArticles/api";
import type { LessonLearned } from "../lessonsLearned/api";

export type TransitionStatus = "DRAFT" | "IN_PROGRESS" | "COMPLETED";

export interface TransitionPackage {
  id: string;
  status: TransitionStatus;
  recommendations: string | null;
  outgoingMandateId: string;
  incomingMandateId: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  isDone: boolean;
  transitionPackageId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransitionContent {
  documents: Document[];
  reports: Report[];
  kpis: Kpi[];
  projects: Project[];
  partners: Partner[];
  finance: { income: number; expense: number; balance: number };
  procedures: KnowledgeArticle[];
  lessonsLearned: LessonLearned[];
  recommendations: string | null;
}

export interface ListTransitionPackagesParams {
  page?: number;
  outgoingMandateId?: string;
  incomingMandateId?: string;
  status?: TransitionStatus;
}

export async function listTransitionPackages(
  params: ListTransitionPackagesParams,
): Promise<PaginatedResponse<TransitionPackage>> {
  const { data } = await api.get<PaginatedResponse<TransitionPackage>>("/transition-packages", { params });
  return data;
}

export async function getTransitionContent(id: string): Promise<TransitionContent> {
  const { data } = await api.get<{ success: boolean; data: TransitionContent }>(
    `/transition-packages/${id}/content`,
  );
  return data.data;
}

export interface TransitionPackageInput {
  outgoingMandateId: string;
  incomingMandateId?: string;
  recommendations?: string;
}

export async function createTransitionPackage(input: TransitionPackageInput): Promise<TransitionPackage> {
  const { data } = await api.post<{ success: boolean; data: TransitionPackage }>(
    "/transition-packages",
    input,
  );
  return data.data;
}

export interface UpdateTransitionPackageInput {
  status?: TransitionStatus;
  incomingMandateId?: string | null;
  recommendations?: string | null;
}

export async function updateTransitionPackage(
  id: string,
  input: UpdateTransitionPackageInput,
): Promise<TransitionPackage> {
  const { data } = await api.patch<{ success: boolean; data: TransitionPackage }>(
    `/transition-packages/${id}`,
    input,
  );
  return data.data;
}

export async function listChecklist(id: string): Promise<ChecklistItem[]> {
  const { data } = await api.get<{ success: boolean; data: ChecklistItem[] }>(
    `/transition-packages/${id}/checklist`,
  );
  return data.data;
}

export async function addChecklistItem(id: string, label: string): Promise<ChecklistItem> {
  const { data } = await api.post<{ success: boolean; data: ChecklistItem }>(
    `/transition-packages/${id}/checklist`,
    { label },
  );
  return data.data;
}

export async function updateChecklistItem(
  id: string,
  itemId: string,
  input: { label?: string; isDone?: boolean },
): Promise<ChecklistItem> {
  const { data } = await api.patch<{ success: boolean; data: ChecklistItem }>(
    `/transition-packages/${id}/checklist/${itemId}`,
    input,
  );
  return data.data;
}

export async function deleteChecklistItem(id: string, itemId: string): Promise<void> {
  await api.delete(`/transition-packages/${id}/checklist/${itemId}`);
}
