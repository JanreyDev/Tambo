import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "flat";
  trendValue?: string;
  color?: string;
  icon?: React.ReactNode;
  className?: string;
}

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

const trendColors = {
  up: "text-status-green",
  down: "text-status-red",
  flat: "text-muted-foreground",
};

export function StatCard({
  label,
  value,
  trend,
  trendValue,
  color,
  icon,
  className,
}: StatCardProps) {
  const TrendIcon = trend ? trendIcons[trend] : null;

  return (
    <div
      className={cn(
        "rounded-xl border border-card-border bg-card p-5 transition-colors hover:border-accent/30",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {icon && (
          <span className="text-muted-foreground">{icon}</span>
        )}
      </div>
      <div className="mt-2 flex items-end gap-3">
        <span
          className="font-metrics text-2xl font-bold"
          style={color ? { color } : undefined}
        >
          {value}
        </span>
        {trend && TrendIcon && (
          <span
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              trendColors[trend],
            )}
          >
            <TrendIcon className="h-3 w-3" />
            {trendValue}
          </span>
        )}
      </div>
    </div>
  );
}
