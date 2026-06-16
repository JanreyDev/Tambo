import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  trend?: { value: number; label: string };
  className?: string;
}

export function StatCard({ label, value, icon, subtitle, trend, className }: StatCardProps) {
  const trendDirection = trend ? (trend.value > 0 ? "up" : trend.value < 0 ? "down" : "flat") : null;

  return (
    <div
      className={cn(
        "flex items-start justify-between p-5 rounded-xl glass-subtle",
        className
      )}
    >
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-foreground">{typeof value === "number" ? value.toLocaleString() : value}</p>
        {subtitle && (
          <p className="text-[11px] text-muted-foreground/70">{subtitle}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1 text-xs">
            {trendDirection === "up" && (
              <>
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  +{trend.value}%
                </span>
              </>
            )}
            {trendDirection === "down" && (
              <>
                <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                <span className="text-red-600 dark:text-red-400 font-medium">
                  {trend.value}%
                </span>
              </>
            )}
            {trendDirection === "flat" && (
              <>
                <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground font-medium">0%</span>
              </>
            )}
            <span className="text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </div>
      <div className="p-3 rounded-xl bg-accent-bg text-accent-text">{icon}</div>
    </div>
  );
}
