"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn, formatPeso } from "@/lib/utils";
import type { RevenueData } from "@/lib/types";

interface RevenueChartProps {
  data: RevenueData[];
  className?: string;
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload) return null;
  return (
    <div className="rounded-lg border border-card-border bg-card p-3 shadow-xl">
      <p className="mb-1 text-xs font-medium text-foreground">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {formatPeso(entry.value)}
        </p>
      ))}
    </div>
  );
}

export function RevenueChart({ data, className }: RevenueChartProps) {
  const currentTotal = data.length > 0 ? (data[data.length - 1]?.total ?? 0) : 0;

  return (
    <div
      className={cn(
        "rounded-xl border border-card-border bg-card p-5",
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          Revenue Overview
        </h2>
        <div className="text-right">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Current MRR
          </span>
          <p className="font-metrics text-xl font-bold text-accent">
            {formatPeso(currentTotal)}
          </p>
        </div>
      </div>

      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="bcmpGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="lgmpGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="pdmpGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="month"
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              axisLine={{ stroke: "#334155" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              axisLine={{ stroke: "#334155" }}
              tickLine={false}
              tickFormatter={(value: number) =>
                value >= 1000 ? `${value / 1000}k` : String(value)
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              iconType="circle"
              iconSize={8}
            />
            <Area
              type="monotone"
              dataKey="bcmp"
              name="BCMP"
              stroke="#3b82f6"
              fill="url(#bcmpGrad)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="lgmp"
              name="LGMP"
              stroke="#22c55e"
              fill="url(#lgmpGrad)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="pdmp"
              name="PDMP"
              stroke="#f59e0b"
              fill="url(#pdmpGrad)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
