import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "SUPER_ADMIN" | "LCP" | "VP" | "TEAM_LEADER" | "MEMBER";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  memberProfile?: {
    firstName: string;
    lastName: string;
  } | null;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (user, token) => set({ user, token }),
      clearAuth: () => set({ user: null, token: null }),
    }),
    { name: "lc-cocody-auth" },
  ),
);
