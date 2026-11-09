import { api } from "../../services/api";
import type { PaginatedResponse } from "../departments/api";

export type PartnerStatus = "PROSPECT" | "CONTACTED" | "MEETING" | "NEGOTIATION" | "PARTNER" | "LOST";

export interface Partner {
  id: string;
  name: string;
  status: PartnerStatus;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  responsibleId: string;
  mandateId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerActivity {
  id: string;
  note: string;
  fromStatus: PartnerStatus | null;
  toStatus: PartnerStatus | null;
  partnerId: string;
  authorId: string;
  createdAt: string;
}

export interface ListPartnersParams {
  page?: number;
  search?: string;
  status?: PartnerStatus;
  responsibleId?: string;
  mandateId?: string;
}

export async function listPartners(params: ListPartnersParams): Promise<PaginatedResponse<Partner>> {
  const { data } = await api.get<PaginatedResponse<Partner>>("/partners", { params });
  return data;
}

export interface PartnerInput {
  name: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  responsibleId: string;
  mandateId?: string;
}

export async function createPartner(input: PartnerInput): Promise<Partner> {
  const { data } = await api.post<{ success: boolean; data: Partner }>("/partners", input);
  return data.data;
}

export async function updatePartner(id: string, input: Partial<PartnerInput>): Promise<Partner> {
  const { data } = await api.patch<{ success: boolean; data: Partner }>(`/partners/${id}`, input);
  return data.data;
}

export async function deletePartner(id: string): Promise<void> {
  await api.delete(`/partners/${id}`);
}

export async function listActivities(partnerId: string): Promise<PartnerActivity[]> {
  const { data } = await api.get<{ success: boolean; data: PartnerActivity[] }>(
    `/partners/${partnerId}/activities`,
  );
  return data.data;
}

export interface AddActivityInput {
  note: string;
  status?: PartnerStatus;
}

export async function addActivity(partnerId: string, input: AddActivityInput): Promise<PartnerActivity> {
  const { data } = await api.post<{ success: boolean; data: PartnerActivity }>(
    `/partners/${partnerId}/activities`,
    input,
  );
  return data.data;
}
