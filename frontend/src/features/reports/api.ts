import { api } from "../../services/api";
import type { PaginatedResponse } from "../departments/api";

export type ReportType = "MONTHLY" | "DEPARTMENTAL" | "MANDATE";

export interface Report {
  id: string;
  title: string;
  type: ReportType;
  period: string;
  content: string | null;
  departmentId: string | null;
  mandateId: string | null;
  authorId: string;
  documentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListReportsParams {
  page?: number;
  search?: string;
  type?: ReportType;
  departmentId?: string;
  mandateId?: string;
}

export async function listReports(params: ListReportsParams): Promise<PaginatedResponse<Report>> {
  const { data } = await api.get<PaginatedResponse<Report>>("/reports", { params });
  return data;
}

export interface CreateReportInput {
  title: string;
  type: ReportType;
  period: string;
  content?: string;
  departmentId?: string;
  mandateId?: string;
  documentId?: string;
}

export async function createReport(input: CreateReportInput): Promise<Report> {
  const { data } = await api.post<{ success: boolean; data: Report }>("/reports", input);
  return data.data;
}

export interface GenerateReportInput {
  title: string;
  type: ReportType;
  period: string;
  departmentId?: string;
  mandateId?: string;
}

export async function generateReport(input: GenerateReportInput): Promise<Report> {
  const { data } = await api.post<{ success: boolean; data: Report }>("/reports/generate", input);
  return data.data;
}

export interface UpdateReportInput {
  title?: string;
  content?: string | null;
  documentId?: string | null;
}

export async function updateReport(id: string, input: UpdateReportInput): Promise<Report> {
  const { data } = await api.patch<{ success: boolean; data: Report }>(`/reports/${id}`, input);
  return data.data;
}

export async function deleteReport(id: string): Promise<void> {
  await api.delete(`/reports/${id}`);
}
