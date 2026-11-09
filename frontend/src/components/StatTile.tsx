import type { LucideIcon } from "lucide-react";

type Tone = "primary" | "success" | "warning" | "error" | "cyan" | "purple";

const toneClasses: Record<Tone, string> = {
  primary: "bg-primary-light text-primary",
  success: "bg-success-light text-success",
  warning: "bg-warning-light text-warning",
  error: "bg-error-light text-error",
  cyan: "bg-cyan-light text-cyan",
  purple: "bg-purple-light text-purple",
};

interface StatTileProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: Tone;
}

export function StatTile({ label, value, icon: Icon, tone = "primary" }: StatTileProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-neutral-300 bg-white p-4">
      <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${toneClasses[tone]}`}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm text-neutral-600">{label}</p>
        <p className="text-2xl font-semibold text-neutral-900">{value}</p>
      </div>
    </div>
  );
}
