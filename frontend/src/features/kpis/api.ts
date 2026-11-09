import { api } from "../../services/api";
import type { PaginatedResponse } from "../departments/api";

export interface Kpi {
  id: string;
  name: string;
  target: number;
  currentValue: number;
  unit: string | null;
  period: string;
  departmentId: string | null;
  mandateId: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListKpisParams {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  mandateId?: string;
}

export async function listKpis(params: ListKpisParams): Promise<PaginatedResponse<Kpi>> {
  const { data } = await api.get<PaginatedResponse<Kpi>>("/kpis", { params });
  return data;
}

export interface KpiInput {
  name: string;
  target: number;
  currentValue?: number;
  unit?: string;
  period: string;
  departmentId?: string;
  mandateId?: string;
}

export async function createKpi(input: KpiInput): Promise<Kpi> {
  const { data } = await api.post<{ success: boolean; data: Kpi }>("/kpis", input);
  return data.data;
}

export async function updateKpi(id: string, input: Partial<KpiInput>): Promise<Kpi> {
  const { data } = await api.patch<{ success: boolean; data: Kpi }>(`/kpis/${id}`, input);
  return data.data;
}

export async function deleteKpi(id: string): Promise<void> {
  await api.delete(`/kpis/${id}`);
}
