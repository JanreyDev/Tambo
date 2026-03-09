"use client";

import { cn } from "@/lib/utils";
import { AlertTriangle, XCircle, Info, X } from "lucide-react";
import type { Alert } from "@/lib/types";

interface AlertBannerProps {
  alert: Alert;
  onAcknowledge: (id: string) => void;
  className?: string;
}

const severityConfig = {
  critical: {
    bg: "bg-red-950/60 border-red-800/50",
    icon: XCircle,
    iconColor: "text-status-red",
    textColor: "text-red-200",
  },
  warning: {
    bg: "bg-amber-950/40 border-amber-800/50",
    icon: AlertTriangle,
    iconColor: "text-status-amber",
    textColor: "text-amber-200",
  },
  info: {
    bg: "bg-blue-950/40 border-blue-800/50",
    icon: Info,
    iconColor: "text-status-blue",
    textColor: "text-blue-200",
  },
};

export function AlertBanner({ alert, onAcknowledge, className }: AlertBannerProps) {
  const config = severityConfig[alert.severity];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3",
        config.bg,
        className,
      )}
      role="alert"
    >
      <Icon className={cn("mt-0.5 h-5 w-5 flex-shrink-0", config.iconColor)} />
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-semibold", config.textColor)}>
          {alert.title}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {alert.description}
        </p>
      </div>
      <button
        onClick={() => onAcknowledge(alert.id)}
        className="flex-shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
        aria-label="Acknowledge alert"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
