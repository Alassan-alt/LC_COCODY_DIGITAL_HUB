import { api } from "../../services/api";

export interface DashboardAlert {
  type: string;
  message: string;
  [key: string]: unknown;
}

export interface DashboardStats {
  members: number;
  departments: number;
  teams: number;
  documents: number;
  projects: number;
  tasks: number;
  tasksOverdue: number;
  events: number;
  kpis: number;
  kpisAverageProgressPercent: number | null;
  finance?: { income: number; expense: number; balance: number };
}

export interface DashboardData {
  generatedAt: string;
  stats: DashboardStats;
  alerts: DashboardAlert[];
  pendingModules: string[];
}

interface DashboardResponse {
  success: boolean;
  data: DashboardData;
}

export async function fetchDashboard(): Promise<DashboardData> {
  const { data } = await api.get<DashboardResponse>("/dashboard");
  return data.data;
}
