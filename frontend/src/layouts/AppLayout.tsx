import {
  BookOpen,
  Building2,
  CalendarClock,
  CalendarRange,
  CheckSquare,
  Coins,
  FileText,
  FileClock,
  FolderKanban,
  Handshake,
  IdCard,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  ScrollText,
  ShieldCheck,
  Target,
  Users,
  Users2,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { NotificationBell } from "../features/notifications/NotificationBell";
import { useAuthStore, type Role } from "../store/authStore";

const navItems: { to: string; label: string; icon: typeof LayoutDashboard; end: boolean; roles?: Role[] }[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/documents", label: "Documents", icon: FileText, end: false },
  { to: "/projects", label: "Projets", icon: FolderKanban, end: false },
  { to: "/tasks", label: "Tâches", icon: CheckSquare, end: false },
  { to: "/events", label: "Événements", icon: CalendarClock, end: false },
  { to: "/meetings", label: "Réunions", icon: Users, end: false },
  {
    to: "/finance",
    label: "Finance",
    icon: Coins,
    end: false,
    roles: ["SUPER_ADMIN", "LCP", "VP", "TEAM_LEADER"],
  },
  {
    to: "/partners",
    label: "Partenaires",
    icon: Handshake,
    end: false,
    roles: ["SUPER_ADMIN", "LCP", "VP", "TEAM_LEADER"],
  },
  { to: "/kpis", label: "KPIs", icon: Target, end: false },
  {
    to: "/reports",
    label: "Rapports",
    icon: ScrollText,
    end: false,
    roles: ["SUPER_ADMIN", "LCP", "VP", "TEAM_LEADER"],
  },
  { to: "/departments", label: "Départements", icon: Building2, end: false },
  { to: "/teams", label: "Équipes", icon: Users2, end: false },
  { to: "/mandates", label: "Mandats", icon: CalendarRange, end: false },
  {
    to: "/members",
    label: "Membres",
    icon: IdCard,
    end: false,
    roles: ["SUPER_ADMIN", "LCP", "VP", "TEAM_LEADER"],
  },
  { to: "/users", label: "Utilisateurs", icon: ShieldCheck, end: false, roles: ["SUPER_ADMIN", "LCP"] },
  { to: "/knowledge-base", label: "Base de connaissances", icon: BookOpen, end: false },
  {
    to: "/transition",
    label: "Transition",
    icon: RefreshCw,
    end: false,
    roles: ["SUPER_ADMIN", "LCP"],
  },
  {
    to: "/audit-logs",
    label: "Journal d'audit",
    icon: FileClock,
    end: false,
    roles: ["SUPER_ADMIN", "LCP"],
  },
];

export function AppLayout() {
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const navigate = useNavigate();

  const handleLogout = (): void => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  const displayName = user?.memberProfile
    ? `${user.memberProfile.firstName} ${user.memberProfile.lastName}`
    : user?.email;

  return (
    <div className="flex min-h-svh bg-neutral-100">
      <aside className="flex w-60 shrink-0 flex-col border-r border-neutral-300 bg-white">
        <div className="border-b border-neutral-300 px-4 py-4">
          <img src="/powered-by-aiesec.png" alt="Powered by AIESEC" className="mb-2 h-5 w-auto" />
          <h1 className="text-base font-semibold text-primary">LC Cocody Digital Hub</h1>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems
            .filter((item) => !item.roles || (user && item.roles.includes(user.role)))
            .map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary-light text-primary"
                    : "text-neutral-700 hover:bg-neutral-100 hover:text-primary"
                }`
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-neutral-300 bg-white px-6 py-3">
          <div />
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="text-right">
              <p className="text-sm font-medium text-neutral-900">{displayName}</p>
              <p className="text-xs text-neutral-500">{user?.role}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-error"
              title="Se déconnecter"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
