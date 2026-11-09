import { api } from "../../services/api";

export type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_DUE_SOON"
  | "TASK_OVERDUE"
  | "DOCUMENT_NEW"
  | "EVENT_NEW"
  | "MEETING_NEW"
  | "REPORT_NEW"
  | "TRANSITION";

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  userId: string;
  createdAt: string;
}

export interface ListNotificationsParams {
  page?: number;
  isRead?: boolean;
}

export interface NotificationsResponse {
  success: boolean;
  items: Notification[];
  meta: { total: number; page: number; limit: number; totalPages: number };
  unreadCount: number;
}

export async function listNotifications(params: ListNotificationsParams): Promise<NotificationsResponse> {
  const { data } = await api.get<NotificationsResponse>("/notifications", { params });
  return data;
}

export async function markNotificationRead(id: string): Promise<Notification> {
  const { data } = await api.patch<{ success: boolean; data: Notification }>(`/notifications/${id}/read`);
  return data.data;
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post("/notifications/read-all");
}
