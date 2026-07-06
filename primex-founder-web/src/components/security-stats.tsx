import { cn } from "@/lib/utils";
import { ShieldAlert, Ban, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { SecurityFeed } from "@/lib/types";
import { Skeleton } from "./skeleton";

interface SecurityStatsProps {
  feed: SecurityFeed | null;
  isLoading: boolean;
  className?: string;
}

export function SecurityStats({ feed, isLoading, className }: SecurityStatsProps) {
  if (isLoading) {
    return (
      <div className={cn("rounded-xl border border-card-border bg-card p-5", className)}>
        <Skeleton className="mb-3 h-4 w-32" />
        <div className="flex gap-4">
          <Skeleton className="h-16 w-1/3" />
          <Skeleton className="h-16 w-1/3" />
          <Skeleton className="h-16 w-1/3" />
        </div>
      </div>
    );
  }

  const data = feed || {
    failed_logins_24h: 0,
    blocked_requests_24h: 0,
    suspicious_ips: [],
    last_updated_at: new Date().toISOString(),
  };

  return (
    <div className={cn("rounded-xl border border-card-border bg-card p-5", className)}>
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
        <ShieldAlert className="h-4 w-4 text-accent" />
        Security Feed
        <span className="ml-auto text-[10px] font-normal text-muted-foreground">
          {feed ? formatDistanceToNow(new Date(data.last_updated_at)) + " ago" : "Mock data"}
        </span>
      </h2>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-surface p-3 text-center">
          <Ban className="mx-auto mb-1 h-4 w-4 text-status-red" />
          <span className="font-metrics text-xl font-bold text-foreground">
            {data.failed_logins_24h}
          </span>
          <p className="text-[10px] text-muted-foreground">Failed Logins (24h)</p>
        </div>

        <div className="rounded-lg bg-surface p-3 text-center">
          <ShieldAlert className="mx-auto mb-1 h-4 w-4 text-status-amber" />
          <span className="font-metrics text-xl font-bold text-foreground">
            {data.blocked_requests_24h}
          </span>
          <p className="text-[10px] text-muted-foreground">Blocked Requests</p>
        </div>

        <div className="rounded-lg bg-surface p-3 text-center">
          <Eye className="mx-auto mb-1 h-4 w-4 text-status-blue" />
          <span className="font-metrics text-xl font-bold text-foreground">
            {data.suspicious_ips.length}
          </span>
          <p className="text-[10px] text-muted-foreground">Suspicious IPs</p>
        </div>
      </div>

      {data.suspicious_ips.length > 0 && (
        <div className="mt-3 space-y-1">
          {data.suspicious_ips.slice(0, 5).map((ip) => (
            <div
              key={ip.ip}
              className="flex items-center justify-between rounded bg-surface px-2 py-1.5 text-xs"
            >
              <span className="font-metrics text-foreground">{ip.ip}</span>
              <span className="text-muted-foreground">
                {ip.attempts} attempts / {ip.country}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
