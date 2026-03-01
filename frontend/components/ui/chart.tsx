"use client";

import * as React from "react";
import {
  Legend,
  ResponsiveContainer,
  Tooltip,
  type TooltipProps
} from "recharts";

import { cn } from "@/lib/utils";

export type ChartConfig = Record<
  string,
  {
    label: string;
    color: string;
  }
>;

export function ChartContainer({
  className,
  children
}: {
  className?: string;
  children: React.ReactElement;
}) {
  return (
    <div className={cn("h-[320px] w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

export function ChartLegend() {
  return <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 12 }} />;
}

export function ChartTooltip(props: TooltipProps<number, string>) {
  return (
    <Tooltip
      {...props}
      contentStyle={{
        borderRadius: 12,
        border: "1px solid rgb(226 232 240)",
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
        backgroundColor: "white"
      }}
      labelStyle={{ color: "rgb(15 23 42)", fontSize: 12, fontWeight: 600 }}
      itemStyle={{ color: "rgb(71 85 105)", fontSize: 12 }}
    />
  );
}
