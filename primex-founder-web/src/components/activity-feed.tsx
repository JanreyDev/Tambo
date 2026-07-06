import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { ActivityEvent } from "@/lib/types";
import { Skeleton } from "./skeleton";

interface ActivityFeedProps {
  events: ActivityEvent[] | null;
  isLoading: boolean;
  className?: string;
}

const productColors: Record<string, string> = {
  bcmp: "#3b82f6",
  lgmp: "#22c55e",
  pdmp: "#f59e0b",
  primex: "#ea580c",
  system: "#94a3b8",
};

const productLabels: Record<string, string> = {
  bcmp: "BCMP",
  lgmp: "LGMP",
  pdmp: "PDMP",
  primex: "PrimeX",
  system: "System",
};

export function ActivityFeed({ events, isLoading, className }: ActivityFeedProps) {
  if (isLoading) {
    return (
      <div className={cn("rounded-xl border border-card-border bg-card p-5", className)}>
        <Skeleton className="mb-4 h-4 w-32" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-3 w-3 rounded-full" />
              <div className="flex-1">
                <Skeleton className="mb-1 h-3 w-full" />
                <Skeleton className="h-2 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const items = events || [];

  return (
    <div className={cn("rounded-xl border border-card-border bg-card p-5", className)}>
      <h2 className="mb-4 text-sm font-semibold text-foreground">
        Activity Timeline
      </h2>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recent activity.</p>
      ) : (
        <div className="relative space-y-0">
          {/* Vertical line */}
          <div className="absolute left-[5px] top-2 bottom-2 w-px bg-card-border" />

          {items.map((event) => {
            const color = productColors[event.product] || "#94a3b8";
            return (
              <div key={event.id} className="relative flex gap-3 pb-4">
                {/* Dot */}
                <span
                  className="relative z-10 mt-1.5 inline-block h-[10px] w-[10px] flex-shrink-0 rounded-full border-2"
                  style={{
                    borderColor: color,
                    backgroundColor: `${color}33`,
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">
                      {event.action}
                    </span>
                    <span
                      className="rounded px-1 py-0.5 text-[9px] font-bold uppercase"
                      style={{
                        color,
                        backgroundColor: `${color}15`,
                      }}
                    >
                      {productLabels[event.product] || event.product}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {event.description}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{event.actor}</span>
                    <span>&middot;</span>
                    <span className="font-metrics">
                      {formatDistanceToNow(new Date(event.timestamp))} ago
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
