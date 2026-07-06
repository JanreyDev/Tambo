import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Deployment } from "@/lib/types";

interface DeploymentRowProps {
  deployment: Deployment;
  className?: string;
}

const statusConfig = {
  success: {
    icon: CheckCircle2,
    color: "text-status-green",
    label: "Passed",
  },
  failed: {
    icon: XCircle,
    color: "text-status-red",
    label: "Failed",
  },
  running: {
    icon: Loader2,
    color: "text-accent",
    label: "Running",
    animate: true,
  },
  pending: {
    icon: Clock,
    color: "text-muted-foreground",
    label: "Pending",
  },
};

export function DeploymentRow({ deployment, className }: DeploymentRowProps) {
  const config = statusConfig[deployment.status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-card-border bg-card px-4 py-3 transition-colors hover:border-accent/20",
        className,
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 flex-shrink-0",
          config.color,
          "animate" in config && config.animate ? "animate-spin" : "",
        )}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {deployment.project_name}
          </span>
          <span className="font-metrics rounded bg-surface-elevated px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {deployment.branch}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {deployment.commit_message}
        </p>
      </div>
      <div className="flex-shrink-0 text-right">
        <span className={cn("text-xs font-medium", config.color)}>
          {config.label}
        </span>
        <p className="font-metrics text-[10px] text-muted-foreground">
          {formatDistanceToNow(new Date(deployment.created_at))} ago
        </p>
      </div>
    </div>
  );
}
