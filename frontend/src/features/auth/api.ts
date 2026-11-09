import { api } from "../../services/api";
import type { AuthUser } from "../../store/authStore";

export interface LoginInput {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  data: {
    user: AuthUser;
    token: string;
  };
}

export async function login(input: LoginInput): Promise<LoginResponse["data"]> {
  const { data } = await api.post<LoginResponse>("/auth/login", input);
  return data.data;
}
