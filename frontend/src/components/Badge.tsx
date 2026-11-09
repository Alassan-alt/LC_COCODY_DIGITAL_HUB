import type { ReactNode } from "react";

type Tone = "neutral" | "primary" | "success" | "warning" | "error" | "purple" | "cyan";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-neutral-100 text-neutral-700",
  primary: "bg-primary-light text-primary",
  success: "bg-success-light text-success-dark",
  warning: "bg-warning-light text-warning-dark",
  error: "bg-error-light text-error-dark",
  purple: "bg-purple-light text-purple",
  cyan: "bg-cyan-light text-cyan",
};

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
}

export function Badge({ children, tone = "neutral" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
