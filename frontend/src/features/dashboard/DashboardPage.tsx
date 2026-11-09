import {
  AlertTriangle,
  Building2,
  CalendarDays,
  CheckSquare,
  Coins,
  FileText,
  FolderKanban,
  Loader2,
  Target,
  Users,
  UsersRound,
  XCircle,
} from "lucide-react";
import { StatTile } from "../../components/StatTile";
import { formatXOF } from "../../utils/currency";
import { useDashboard } from "./useDashboard";

export function DashboardPage() {
  const { data, isLoading, isError } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-neutral-600">
        <Loader2 className="size-5 animate-spin" />
        Chargement du tableau de bord…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-error-light px-4 py-3 text-error-dark">
        <XCircle className="size-5" />
        Impossible de charger le tableau de bord.
      </div>
    );
  }

  const { stats, alerts } = data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900">Tableau de bord</h2>
        <p className="text-sm text-neutral-600">Vue d'ensemble en temps réel du LC Cocody</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatTile label="Membres" value={stats.members} icon={Users} tone="primary" />
        <StatTile label="Départements" value={stats.departments} icon={Building2} tone="cyan" />
        <StatTile label="Équipes" value={stats.teams} icon={UsersRound} tone="purple" />
        <StatTile label="Documents" value={stats.documents} icon={FileText} tone="primary" />
        <StatTile label="Projets" value={stats.projects} icon={FolderKanban} tone="primary" />
        <StatTile label="Tâches" value={stats.tasks} icon={CheckSquare} tone="primary" />
        <StatTile
          label="Tâches en retard"
          value={stats.tasksOverdue}
          icon={AlertTriangle}
          tone={stats.tasksOverdue > 0 ? "error" : "success"}
        />
        <StatTile label="Événements" value={stats.events} icon={CalendarDays} tone="cyan" />
        <StatTile
          label="KPI (progression moy.)"
          value={stats.kpisAverageProgressPercent !== null ? `${stats.kpisAverageProgressPercent}%` : "—"}
          icon={Target}
          tone="warning"
        />
        {stats.finance && (
          <StatTile
            label="Solde financier"
            value={formatXOF(stats.finance.balance)}
            icon={Coins}
            tone={stats.finance.balance >= 0 ? "success" : "error"}
          />
        )}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-neutral-900">Alertes</h3>
        {alerts.length === 0 ? (
          <p className="text-sm text-neutral-500">Aucune alerte pour le moment.</p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((alert, index) => {
              const isCritical = alert.type.includes("OVERDUE");
              return (
                <li
                  key={index}
                  className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${
                    isCritical
                      ? "border-error-light bg-error-light text-error-dark"
                      : "border-warning-light bg-warning-light text-warning-dark"
                  }`}
                >
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <span>{alert.message}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
