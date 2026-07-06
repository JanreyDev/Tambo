"use client";

import { cn } from "@/lib/utils";

interface ConnectionPulseProps {
  status: "connected" | "error" | "warning";
  size?: "sm" | "md" | "lg";
  label?: string;
}

const colorMap = {
  connected: "text-status-green",
  error: "text-status-red",
  warning: "text-status-amber",
};

const sizeMap = {
  sm: "h-2 w-2",
  md: "h-3 w-3",
  lg: "h-4 w-4",
};

export function ConnectionPulse({
  status,
  size = "md",
  label,
}: ConnectionPulseProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={cn(
          "inline-block rounded-full animate-pulse-glow",
          colorMap[status],
          sizeMap[size],
        )}
        style={{ backgroundColor: "currentColor" }}
        aria-label={label || `Status: ${status}`}
        role="status"
      />
      {label && (
        <span className="text-xs text-muted-foreground">{label}</span>
      )}
    </span>
  );
}
