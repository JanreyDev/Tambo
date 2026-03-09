import { cn } from "@/lib/utils";
import { ConnectionPulse } from "./connection-pulse";
import { Users, Clock, AlertTriangle } from "lucide-react";
import type { ProductHealth } from "@/lib/types";

interface ProductHealthCardProps {
  health: ProductHealth;
  className?: string;
}

const productColors: Record<string, string> = {
  bcmp: "#3b82f6",
  lgmp: "#22c55e",
  pdmp: "#f59e0b",
};

const productNames: Record<string, string> = {
  bcmp: "BCMP",
  lgmp: "LGMP",
  pdmp: "PDMP",
};

export function ProductHealthCard({ health, className }: ProductHealthCardProps) {
  const color = productColors[health.slug] || "#94a3b8";
  const statusMap = {
    healthy: "connected" as const,
    degraded: "warning" as const,
    unhealthy: "error" as const,
    unknown: "warning" as const,
  };

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-5 transition-colors",
        className,
      )}
      style={{ borderColor: `${color}33` }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <h3 className="text-sm font-bold" style={{ color }}>
            {productNames[health.slug] || health.product}
          </h3>
        </div>
        <ConnectionPulse status={statusMap[health.api_status]} size="sm" />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3 w-3" />
            Response Time
          </span>
          <span className="font-metrics font-medium text-foreground">
            {health.response_time_ms}ms
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <AlertTriangle className="h-3 w-3" />
            Error Rate
          </span>
          <span
            className={cn(
              "font-metrics font-medium",
              health.error_rate > 5
                ? "text-status-red"
                : health.error_rate > 1
                  ? "text-status-amber"
                  : "text-status-green",
            )}
          >
            {health.error_rate}%
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-3 w-3" />
            Active Users
          </span>
          <span className="font-metrics font-medium text-foreground">
            {health.active_users}
          </span>
        </div>
      </div>
    </div>
  );
}
