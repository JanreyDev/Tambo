import { cn, formatBytes } from "@/lib/utils";
import { ConnectionPulse } from "./connection-pulse";
import { Database } from "lucide-react";
import type { DatabaseStatus } from "@/lib/types";

interface DatabaseCardProps {
  database: DatabaseStatus;
  className?: string;
}

export function DatabaseCard({ database, className }: DatabaseCardProps) {
  const statusMap = {
    online: "connected" as const,
    offline: "error" as const,
    maintenance: "warning" as const,
  };

  return (
    <div
      className={cn(
        "min-w-[240px] flex-shrink-0 rounded-xl border border-card-border bg-card p-4 transition-colors hover:border-accent/30",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold text-foreground">
            {database.name}
          </h3>
        </div>
        <ConnectionPulse status={statusMap[database.status]} size="sm" />
      </div>

      <div className="space-y-1.5 text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span>Engine</span>
          <span className="font-metrics text-foreground">
            {database.engine} {database.version}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Connections</span>
          <span className="font-metrics text-foreground">
            {database.connection_count}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Size</span>
          <span className="font-metrics text-foreground">
            {formatBytes(database.size_bytes)}
          </span>
        </div>
      </div>
    </div>
  );
}
