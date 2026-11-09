import { api } from "../../services/api";
import type { PaginatedResponse } from "../departments/api";

export type MandateStatus = "ACTIVE" | "CLOSED";

export interface Mandate {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  status: MandateStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ListMandatesParams {
  page?: number;
  limit?: number;
  status?: MandateStatus;
}

export async function listMandates(params: ListMandatesParams): Promise<PaginatedResponse<Mandate>> {
  const { data } = await api.get<PaginatedResponse<Mandate>>("/mandates", { params });
  return data;
}

export interface MandateInput {
  label: string;
  startDate: string;
  endDate: string;
}

export async function createMandate(input: MandateInput): Promise<Mandate> {
  const { data } = await api.post<{ success: boolean; data: Mandate }>("/mandates", input);
  return data.data;
}

export async function updateMandate(
  id: string,
  input: Partial<MandateInput>,
): Promise<Mandate> {
  const { data } = await api.patch<{ success: boolean; data: Mandate }>(`/mandates/${id}`, input);
  return data.data;
}

export async function closeMandate(id: string): Promise<Mandate> {
  const { data } = await api.delete<{ success: boolean; data: Mandate }>(`/mandates/${id}`);
  return data.data;
}
