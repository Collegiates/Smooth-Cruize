"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, RefreshCw } from "lucide-react";

import { DailyPotholeChart } from "@/components/charts/DailyPotholeChart";
import { CreateWorkOrderDialog } from "@/components/work-orders/create-work-order-dialog";
import { FiltersBar } from "@/components/maps/filters-bar";
import { WorkOrdersTable } from "@/components/work-orders/work-orders-table";
import { Button } from "@/components/ui/button";
import { Widget } from "@/components/ui/widget";
import { useToast } from "@/components/ui/toast-provider";
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
      getPotholeEvents(filters),
      getDailyPotholeStats()
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-slate-900">Municipal Operations Overview</div>
          <div className="text-sm text-slate-600">Daily pothole activity, work order backlog, and service distribution.</div>
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

      <div className="grid gap-3 md:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-slate-600">{metric.label}</div>
            <div className="mt-1 text-xl font-semibold tabular-nums text-slate-900">{metric.value}</div>
          </div>
        ))}
      </div>

      <FiltersBar filters={filters} onChange={setFilters} showSearch />

      <div className="flex flex-wrap items-center gap-2">
        {quickStatuses.map((status) => (
          <button
            key={status}
            type="button"
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              (filters.status ?? "all") === status
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
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
              onSelectEvent={() => undefined}
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
    { label: "Assigned", value: 15, color: "#2563eb" },
    { label: "In Progress", value: 11, color: "#7c3aed" },
    { label: "Resolved", value: 18, color: "#16a34a" }
  ];
  const max = Math.max(...series.map((item) => item.value));

  return (
    <div className="space-y-3">
      {series.map((item) => (
        <div key={item.label} className="grid grid-cols-[100px_1fr_36px] items-center gap-3">
          <span className="text-sm text-slate-600">{item.label}</span>
          <div className="h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full" style={{ width: `${(item.value / max) * 100}%`, backgroundColor: item.color }} />
          </div>
          <span className="text-right text-sm font-medium tabular-nums text-slate-900">{item.value}</span>
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
    <svg viewBox="0 0 360 220" className="w-full">
      {months.map((item, index) => {
        const x = 20 + index * 55;
        const barHeight = (item.value / max) * 130;
        return (
          <g key={item.month}>
            <rect x={x} y={170 - barHeight} width="28" height={barHeight} rx="6" fill="#38bdf8" />
            <text x={x + 14} y={190} textAnchor="middle" fontSize="12" fill="#475569">
              {item.month}
            </text>
            <text x={x + 14} y={160 - barHeight} textAnchor="middle" fontSize="11" fill="#0f172a">
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
    <div className="grid gap-4 md:grid-cols-[160px_1fr]">
      <div className="relative mx-auto h-40 w-40 rounded-full" style={{ background: gradient }}>
        <div className="absolute inset-6 rounded-full bg-white" />
      </div>
      <div className="space-y-2">
        {slices.map((slice) => (
          <div key={slice.label} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: slice.color }} />
              <span className="text-slate-700">{slice.label}</span>
            </div>
            <span className="font-medium tabular-nums text-slate-900">{slice.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
