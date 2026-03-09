"use client";

import { cn } from "@/lib/utils";

interface MetricGaugeProps {
  value: number;
  label: string;
  size?: number;
  className?: string;
}

function getColor(value: number): string {
  if (value >= 90) return "#ef4444";
  if (value >= 75) return "#f59e0b";
  return "#22c55e";
}

export function MetricGauge({
  value,
  label,
  size = 72,
  className,
}: MetricGaugeProps) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color = getColor(value);

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <svg
        width={size}
        height={size}
        className="gauge-glow -rotate-90"
        aria-label={`${label}: ${value}%`}
        role="meter"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
        />
        {/* Value */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
        {/* Center text */}
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          className="rotate-90 font-metrics text-xs font-bold"
          fill={color}
          style={{
            transformOrigin: `${size / 2}px ${size / 2}px`,
          }}
        >
          {value}%
        </text>
      </svg>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
