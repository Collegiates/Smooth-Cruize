"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, RefreshCw } from "lucide-react";

import { DailyPotholeChart } from "@/components/charts/DailyPotholeChart";
import { CreateWorkOrderDialog } from "@/components/work-orders/create-work-order-dialog";
import { FiltersBar } from "@/components/maps/filters-bar";
import { WorkOrdersTable } from "@/components/work-orders/work-orders-table";
import { Button } from "@/components/ui/button";
import { Widget } from "@/components/ui/widget";
import { useToast } from "@/components/ui/toast-provider";
import { useSupabase } from "@/components/supabase-provider";
import { exportEventsAsCsv, getPotholeEvents } from "@/lib/api/pothole-events";
import { getDailyPotholeStats } from "@/lib/analytics";
import type { DailyPotholeStat, DailyPotholeSummary, EventFilters, PotholeEvent, PotholeStatus } from "@/lib/types";

const initialFilters: EventFilters = {
  status: "all",
  severityRange: [1, 10],
  dateFrom: "",
  dateTo: "",
  showHeatmap: false,
  search: ""
};

const quickStatuses: Array<PotholeStatus | "all"> = ["all", "open", "assigned", "in_progress", "resolved"];

function sortEvents(events: PotholeEvent[], sortDescending: boolean) {
  return [...events].sort((a, b) => (sortDescending ? b.severity - a.severity : a.severity - b.severity));
}

export default function AdminDashboardPage() {
  const { pushToast } = useToast();
  const supabase = useSupabase();
  const router = useRouter();
  const [filters, setFilters] = useState<EventFilters>(initialFilters);
  const [events, setEvents] = useState<PotholeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState<DailyPotholeStat[]>([]);
  const [dailySummary, setDailySummary] = useState<DailyPotholeSummary>({
    newToday: 0,
    resolvedToday: 0,
    averageSeverity7d: 0,
    openTotal: 0
  });
  const [sortDescending, setSortDescending] = useState(true);

  const refreshEvents = async () => {
    setLoading(true);
    setAnalyticsLoading(true);
    const [nextEvents, analytics] = await Promise.all([
      getPotholeEvents(filters, supabase),
      getDailyPotholeStats(supabase)
    ]);
    const sortedEvents = sortEvents(nextEvents, sortDescending);
    setEvents(sortedEvents);
    setDailyStats(analytics.stats);
    setDailySummary(analytics.summary);
    setLoading(false);
    setAnalyticsLoading(false);
  };

  useEffect(() => {
    void refreshEvents();
  }, [filters, sortDescending]);

  const metrics = useMemo(() => {
    const now = Date.now();
    const openCount = events.filter((event) => ["open", "assigned", "in_progress"].includes(event.status)).length;
    const avgSeverity = events.length
      ? (events.reduce((sum, event) => sum + event.severity, 0) / events.length).toFixed(1)
      : "0.0";
    const newToday = events.filter((event) => new Date(event.detected_at).toDateString() === new Date().toDateString()).length;
    const resolved7d = events.filter(
      (event) => event.status === "resolved" && now - new Date(event.detected_at).getTime() <= 7 * 24 * 60 * 60 * 1000
    ).length;

    return [
      { label: "Open Work Orders", value: openCount },
      { label: "Avg Severity (7d)", value: avgSeverity },
      { label: "New Today", value: newToday },
      { label: "Resolved (7d)", value: resolved7d }
    ];
  }, [events]);

  const downloadCsv = () => {
    const csv = exportEventsAsCsv(events);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "pothole-events.csv");
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleQuickFilter = (status: PotholeStatus | "all") => {
    setFilters((current) => ({ ...current, status }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
        <div>
          <h1 className="text-3xl font-display font-semibold tracking-tight text-white/90 drop-shadow-md">Municipal Operations Overview</h1>
          <div className="text-sm font-medium text-cyan-200/80 uppercase tracking-widest mt-1">Daily pothole activity, work order backlog, and service distribution.</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CreateWorkOrderDialog
            onCreated={(event) => {
              setEvents((current) => sortEvents([event, ...current], sortDescending));
              pushToast({ title: "Work order created", description: `Record ${event.id.slice(0, 8)} is ready for triage.` });
            }}
          />
          <Button variant="outline" className="h-9 rounded-lg px-3 text-sm" onClick={downloadCsv}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" className="h-9 rounded-lg px-3 text-sm" onClick={() => void refreshEvents()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4 relative z-10">
        {metrics.map((metric) => (
          <div key={metric.label} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 px-5 py-6 backdrop-blur-xl transition-all duration-300 hover:border-cyan-400/30 hover:shadow-[0_0_30px_-5px_var(--tw-shadow-color)] hover:shadow-cyan-500/20">
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <div className="relative z-10 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300/80">{metric.label}</div>
            <div className="relative z-10 mt-2 text-4xl font-light tabular-nums tracking-tighter text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">{metric.value}</div>
          </div>
        ))}
      </div>

      <FiltersBar filters={filters} onChange={setFilters} showSearch />

      <div className="flex flex-wrap items-center gap-2">
        {quickStatuses.map((status) => (
          <button
            key={status}
            type="button"
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold tracking-wider transition-all duration-300 ${(filters.status ?? "all") === status
              ? "border-cyan-400/50 bg-cyan-500/20 text-cyan-100 shadow-[0_0_15px_-3px_rgba(34,211,238,0.4)]"
              : "border-white/10 bg-white/5 text-slate-400 hover:border-cyan-400/30 hover:bg-cyan-900/20 hover:text-cyan-200"
              }`}
            onClick={() => handleQuickFilter(status)}
          >
            {status === "all" ? "All" : status.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 xl:grid-cols-2">
          <Widget
            title="Work Orders Inbox"
            subtitle="Prioritized by severity"
            onRefresh={() => void refreshEvents()}
            loading={loading}
            emptyState="No work orders match the current filters."
            footer={<span>{events.length} visible work orders</span>}
            maxBodyHeight="420px"
          >
            <WorkOrdersTable
              events={events}
              onSelectEvent={(event) => {
                router.push(`/admin/work-orders/${event.id}`);
              }}
              sortDescending={sortDescending}
              onToggleSort={() => setSortDescending((value) => !value)}
            />
          </Widget>

          <Widget title="Maintenance Status Overview" subtitle="Current workflow mix" maxBodyHeight="420px">
            <div className="p-4">
              <StatusChart />
            </div>
          </Widget>
        </div>

        <Widget
          title="Daily Pothole Activity"
          subtitle="Reported vs resolved over the last 14 days"
          onRefresh={() => void refreshEvents()}
          loading={analyticsLoading}
          emptyState="No activity available for the last 14 days."
          maxBodyHeight="none"
        >
          <DailyPotholeChart data={dailyStats} summary={dailySummary} loading={analyticsLoading} />
        </Widget>

        <div className="grid gap-4 xl:grid-cols-2">
          <Widget title="Detections by Month" subtitle="Rolling trend" maxBodyHeight="420px">
            <div className="p-4">
              <MonthlyBars />
            </div>
          </Widget>

          <Widget title="Services In Process" subtitle="Crew distribution" maxBodyHeight="420px">
            <div className="p-4">
              <ServicesDonut />
            </div>
          </Widget>
        </div>
      </div>
    </div>
  );
}

function StatusChart() {
  const series = [
    { label: "Open", value: 22, color: "#f59e0b" },
    { label: "Assigned", value: 15, color: "#38bdf8" },
    { label: "In Progress", value: 11, color: "#c084fc" },
    { label: "Resolved", value: 18, color: "#2dd4bf" }
  ];
  const max = Math.max(...series.map((item) => item.value));

  return (
    <div className="space-y-4">
      {series.map((item) => (
        <div key={item.label} className="group grid grid-cols-[110px_1fr_40px] items-center gap-4">
          <span className="text-sm font-medium tracking-wide text-slate-300">{item.label}</span>
          <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-800/80 shadow-inner">
            <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-in-out group-hover:brightness-125" style={{ width: `${(item.value / max) * 100}%`, backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}80` }} />
          </div>
          <span className="text-right text-sm font-bold tabular-nums text-white group-hover:text-cyan-100 transition-colors">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function MonthlyBars() {
  const months = [
    { month: "Jan", value: 18 },
    { month: "Feb", value: 24 },
    { month: "Mar", value: 20 },
    { month: "Apr", value: 28 },
    { month: "May", value: 16 },
    { month: "Jun", value: 22 }
  ];
  const max = Math.max(...months.map((item) => item.value));

  return (
    <svg viewBox="0 0 360 220" className="w-full drop-shadow-lg">
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      {months.map((item, index) => {
        const x = 20 + index * 55;
        const barHeight = (item.value / max) * 130;
        return (
          <g key={item.month} className="group transition-all duration-300 hover:opacity-80 cursor-default">
            <rect x={x} y={170 - barHeight} width="28" height={barHeight} rx="6" fill="url(#barGrad)" />
            <text x={x + 14} y={190} textAnchor="middle" fontSize="12" fontWeight="600" fill="#94a3b8">
              {item.month}
            </text>
            <text x={x + 14} y={160 - barHeight} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#f8fafc" className="opacity-0 group-hover:opacity-100 transition-opacity">
              {item.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function ServicesDonut() {
  const slices = [
    { label: "Patching", value: 38, color: "#2563eb" },
    { label: "Dispatch", value: 27, color: "#0f766e" },
    { label: "QA", value: 19, color: "#16a34a" },
    { label: "Rejected", value: 16, color: "#dc2626" }
  ];
  const gradient = `conic-gradient(${slices
    .map((slice, index) => {
      const previous = slices.slice(0, index).reduce((sum, item) => sum + item.value, 0);
      const current = previous + slice.value;
      return `${slice.color} ${previous}% ${current}%`;
    })
    .join(", ")})`;

  return (
    <div className="grid gap-6 md:grid-cols-[160px_1fr] items-center">
      <div className="relative mx-auto h-40 w-40 rounded-full shadow-[0_0_30px_-5px_var(--tw-shadow-color)] shadow-cyan-500/20" style={{ background: gradient }}>
        <div className="absolute inset-6 rounded-full bg-[hsl(222,47%,11%)] flex items-center justify-center shadow-inner">
          <div className="text-center">
            <div className="text-2xl font-light text-white leading-none tracking-tighter">100<span className="text-sm text-cyan-400">%</span></div>
          </div>
        </div>
      </div>
      <div className="space-y-2.5">
        {slices.map((slice) => (
          <div key={slice.label} className="group flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-2.5 text-sm backdrop-blur transition-colors hover:bg-white/10 hover:border-white/10">
            <div className="flex items-center gap-3">
              <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: slice.color, boxShadow: `0 0 8px ${slice.color}` }} />
              <span className="text-slate-200 font-medium tracking-wide group-hover:text-white transition-colors">{slice.label}</span>
            </div>
            <span className="font-bold tabular-nums text-white/90">{slice.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
