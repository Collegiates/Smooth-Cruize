"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartLegend, ChartTooltip } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import type { DailyPotholeStat, DailyPotholeSummary } from "@/lib/types";

type DailyPotholeChartProps = {
  data: DailyPotholeStat[];
  summary: DailyPotholeSummary;
  loading?: boolean;
};

export function DailyPotholeChart({ data, summary, loading = false }: DailyPotholeChartProps) {
  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <div className="grid gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-20 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-[280px] rounded-lg" />
      </div>
    );
  }

  if (data.length === 0) {
    return <div className="px-4 py-12 text-center text-sm text-slate-500">No analytics available for the selected period.</div>;
  }

  const metrics = [
    { label: "New Today", value: summary.newToday },
    { label: "Resolved Today", value: summary.resolvedToday },
    { label: "7-day Avg Severity", value: summary.averageSeverity7d.toFixed(1) },
    { label: "Open Total", value: summary.openTotal }
  ];

  return (
    <div className="space-y-4 p-4">
      <div className="grid gap-3 md:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-slate-500">{metric.label}</div>
            <div className="mt-2 text-lg font-semibold tabular-nums text-slate-900">{metric.value}</div>
          </div>
        ))}
      </div>

      <ChartContainer>
        <LineChart data={data} margin={{ top: 12, right: 12, left: -12, bottom: 0 }}>
          <CartesianGrid stroke="rgb(241 245 249)" vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "rgb(100 116 139)", fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            tick={{ fill: "rgb(100 116 139)", fontSize: 12 }}
          />
          <ChartTooltip />
          <ChartLegend />
          <Line
            type="monotone"
            dataKey="reported"
            name="Reported"
            stroke="rgb(37 99 235)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="resolved"
            name="Resolved"
            stroke="rgb(22 163 74)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
