import { cn } from "@/lib/utils";
import { formatUptime } from "@/lib/utils";
import { MetricGauge } from "./metric-gauge";
import { ConnectionPulse } from "./connection-pulse";
import type { DropletMetrics } from "@/lib/types";

interface DropletCardProps {
  droplet: DropletMetrics;
  className?: string;
}

export function DropletCard({ droplet, className }: DropletCardProps) {
  const statusMap = {
    active: "connected" as const,
    off: "error" as const,
    error: "error" as const,
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-card-border bg-card p-5 transition-colors hover:border-accent/30",
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {droplet.name}
          </h3>
          <span className="font-metrics text-xs text-muted-foreground">
            {droplet.ip}
          </span>
        </div>
        <ConnectionPulse status={statusMap[droplet.status]} />
      </div>

      <div className="flex items-center justify-around">
        <MetricGauge value={droplet.cpu_percent} label="CPU" />
        <MetricGauge value={droplet.ram_percent} label="RAM" />
        <MetricGauge value={droplet.disk_percent} label="Disk" />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-card-border pt-3">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {droplet.spec}
        </span>
        <span className="font-metrics text-[10px] text-muted-foreground">
          up {formatUptime(droplet.uptime_seconds)}
        </span>
      </div>
    </div>
  );
}
