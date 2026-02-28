"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, RefreshCw } from "lucide-react";

import { CreateWorkOrderDialog } from "@/components/work-orders/create-work-order-dialog";
import { FiltersBar } from "@/components/maps/filters-bar";
import { WorkOrdersTable } from "@/components/work-orders/work-orders-table";
import { Button } from "@/components/ui/button";
import { Widget } from "@/components/ui/widget";
import { useToast } from "@/components/ui/toast-provider";
import { exportEventsAsCsv, getPotholeEvents } from "@/lib/api/pothole-events";
import type { EventFilters, PotholeEvent, PotholeStatus } from "@/lib/types";

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
  const [sortDescending, setSortDescending] = useState(true);

  const refreshEvents = async () => {
    setLoading(true);
    const nextEvents = await getPotholeEvents(filters);
    const sortedEvents = sortEvents(nextEvents, sortDescending);
    setEvents(sortedEvents);
    setLoading(false);
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
        <div className="text-sm text-gray-600">Dashboard-only view. Use the admin Map route for work-order map triage.</div>

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
          <div key={metric.label} className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-xs text-gray-500">{metric.label}</div>
            <div className="mt-1 text-xl font-semibold text-gray-900">{metric.value}</div>
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
                ? "border-sky-200 bg-sky-50 text-sky-700"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900"
            }`}
            onClick={() => handleQuickFilter(status)}
          >
            {status === "all" ? "All" : status.replace("_", " ")}
          </button>
        ))}
      </div>

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
  );
}

function StatusChart() {
  const series = [
    { label: "Open", value: 22, color: "#ef4444" },
    { label: "Assigned", value: 15, color: "#0ea5e9" },
    { label: "In Progress", value: 11, color: "#f59e0b" },
    { label: "Resolved", value: 18, color: "#10b981" }
  ];
  const max = Math.max(...series.map((item) => item.value));

  return (
    <div className="space-y-3">
      {series.map((item) => (
        <div key={item.label} className="grid grid-cols-[100px_1fr_36px] items-center gap-3">
          <span className="text-sm text-gray-600">{item.label}</span>
          <div className="h-2 rounded-full bg-gray-100">
            <div className="h-2 rounded-full" style={{ width: `${(item.value / max) * 100}%`, backgroundColor: item.color }} />
          </div>
          <span className="text-right text-sm font-medium text-gray-900">{item.value}</span>
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
            <text x={x + 14} y={190} textAnchor="middle" fontSize="12" fill="#6b7280">
              {item.month}
            </text>
            <text x={x + 14} y={160 - barHeight} textAnchor="middle" fontSize="11" fill="#111827">
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
    { label: "Patching", value: 38, color: "#0ea5e9" },
    { label: "Dispatch", value: 27, color: "#f59e0b" },
    { label: "QA", value: 19, color: "#10b981" },
    { label: "Rejected", value: 16, color: "#ef4444" }
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
          <div key={slice.label} className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: slice.color }} />
              <span className="text-gray-700">{slice.label}</span>
            </div>
            <span className="font-medium text-gray-900">{slice.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
