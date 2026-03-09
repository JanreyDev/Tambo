import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { MabiniInsight } from "@/lib/types";
import { Skeleton } from "./skeleton";

interface MabiniInsightCardProps {
  insight: MabiniInsight | null;
  isLoading: boolean;
  className?: string;
}

export function MabiniInsightCard({
  insight,
  isLoading,
  className,
}: MabiniInsightCardProps) {
  if (isLoading) {
    return (
      <div className={cn("rounded-xl border border-accent/20 bg-orange-950/20 p-5", className)}>
        <Skeleton className="mb-3 h-4 w-32 bg-orange-900/30" />
        <Skeleton className="mb-2 h-4 w-full bg-orange-900/30" />
        <Skeleton className="h-4 w-3/4 bg-orange-900/30" />
      </div>
    );
  }

  if (!insight) {
    return (
      <div className={cn("rounded-xl border border-accent/20 bg-orange-950/20 p-5", className)}>
        <div className="flex items-center gap-2 text-accent">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-semibold">Mabini Daily Brief</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Mabini AI analysis is not yet available. Connect the API to enable daily system insights.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-accent/20 bg-orange-950/20 p-5", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-accent">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-semibold">Mabini Daily Brief</span>
        </div>
        <span className="text-[10px] text-muted-foreground">
          Last analyzed: {formatDistanceToNow(new Date(insight.analyzed_at))} ago
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-foreground">
        {insight.summary}
      </p>
      {insight.highlights.length > 0 && (
        <ul className="mt-3 space-y-1">
          {insight.highlights.map((highlight, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2 text-xs text-muted-foreground"
            >
              <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
              {highlight}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
