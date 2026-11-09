import { createBrowserRouter } from "react-router-dom";
import { LoginPage } from "../features/auth/LoginPage";
import { AuditLogsPage } from "../features/auditLogs/AuditLogsPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { DepartmentsPage } from "../features/departments/DepartmentsPage";
import { DocumentsPage } from "../features/documents/DocumentsPage";
import { EventsPage } from "../features/events/EventsPage";
import { FinancePage } from "../features/finance/FinancePage";
import { KnowledgeArticlesPage } from "../features/knowledgeArticles/KnowledgeArticlesPage";
import { KpisPage } from "../features/kpis/KpisPage";
import { MandatesPage } from "../features/mandates/MandatesPage";
import { MeetingsPage } from "../features/meetings/MeetingsPage";
import { MembersPage } from "../features/members/MembersPage";
import { PartnersPage } from "../features/partners/PartnersPage";
import { ReportsPage } from "../features/reports/ReportsPage";
import { ProjectBoardPage } from "../features/projects/ProjectBoardPage";
import { ProjectsPage } from "../features/projects/ProjectsPage";
import { TasksPage } from "../features/tasks/TasksPage";
import { TeamsPage } from "../features/teams/TeamsPage";
import { TransitionPage } from "../features/transition/TransitionPage";
import { UsersPage } from "../features/users/UsersPage";
import { AppLayout } from "../layouts/AppLayout";
import { ProtectedRoute } from "./ProtectedRoute";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "documents", element: <DocumentsPage /> },
          { path: "departments", element: <DepartmentsPage /> },
          { path: "teams", element: <TeamsPage /> },
          { path: "mandates", element: <MandatesPage /> },
          { path: "members", element: <MembersPage /> },
          { path: "users", element: <UsersPage /> },
          { path: "projects", element: <ProjectsPage /> },
          { path: "projects/:id/board", element: <ProjectBoardPage /> },
          { path: "tasks", element: <TasksPage /> },
          { path: "events", element: <EventsPage /> },
          { path: "meetings", element: <MeetingsPage /> },
          { path: "finance", element: <FinancePage /> },
          { path: "partners", element: <PartnersPage /> },
          { path: "kpis", element: <KpisPage /> },
          { path: "reports", element: <ReportsPage /> },
          { path: "knowledge-base", element: <KnowledgeArticlesPage /> },
          { path: "transition", element: <TransitionPage /> },
          { path: "audit-logs", element: <AuditLogsPage /> },
        ],
      },
    ],
  },
]);

// Les routes des autres modules métier (équipes, mandats, membres, utilisateurs, ...)
// seront ajoutées progressivement dans src/features/*.
