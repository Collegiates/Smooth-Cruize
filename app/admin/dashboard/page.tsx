"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, LocateFixed, Map, LayoutGrid, RefreshCw, Radio } from "lucide-react";

import { CreateWorkOrderDialog } from "@/components/work-orders/create-work-order-dialog";
import { FiltersBar } from "@/components/maps/filters-bar";
import { PotholeMap } from "@/components/maps/pothole-map";
import { WorkOrdersTable } from "@/components/work-orders/work-orders-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Widget } from "@/components/ui/widget";
import { useToast } from "@/components/ui/toast-provider";
import { exportEventsAsCsv, getPotholeEvents, updatePotholeEvent } from "@/lib/api/pothole-events";
import type { EventFilters, PotholeEvent, PotholeStatus } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/work-orders/status-badge";
import { SeverityBadge } from "@/components/work-orders/severity-badge";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pushToast } = useToast();
  const [filters, setFilters] = useState<EventFilters>(initialFilters);
  const [events, setEvents] = useState<PotholeEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<PotholeEvent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortDescending, setSortDescending] = useState(true);
  const [liveUpdates, setLiveUpdates] = useState(true);
  const [viewMode, setViewMode] = useState<"dashboard" | "map">(searchParams.get("view") === "map" ? "map" : "dashboard");

  const refreshEvents = async () => {
    setLoading(true);
    const nextEvents = await getPotholeEvents(filters);
    const sortedEvents = sortEvents(nextEvents, sortDescending);
    setEvents(sortedEvents);
    setSelectedEvent((current) => sortedEvents.find((event) => event.id === current?.id) ?? sortedEvents[0] ?? null);
    setLoading(false);
  };

  useEffect(() => {
    setViewMode(searchParams.get("view") === "map" ? "map" : "dashboard");
  }, [searchParams]);

  useEffect(() => {
    void refreshEvents();
  }, [filters, sortDescending]);

  useEffect(() => {
    if (!liveUpdates) {
      return;
    }

    const timer = window.setInterval(() => {
      void refreshEvents();
    }, 20000);

    return () => window.clearInterval(timer);
  }, [filters, sortDescending, liveUpdates]);

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

  const setMode = (mode: "dashboard" | "map") => {
    setViewMode(mode);
    router.replace(`/admin/dashboard${mode === "map" ? "?view=map" : ""}`);
  };

  const handleQuickFilter = (status: PotholeStatus | "all") => {
    setFilters((current) => ({ ...current, status }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={viewMode === "dashboard" ? "default" : "outline"}
            className="h-9 rounded-lg px-3 text-sm"
            onClick={() => setMode("dashboard")}
          >
            <LayoutGrid className="mr-2 h-4 w-4" />
            Dashboard View
          </Button>
          <Button
            variant={viewMode === "map" ? "default" : "outline"}
            className="h-9 rounded-lg px-3 text-sm"
            onClick={() => setMode("map")}
          >
            <Map className="mr-2 h-4 w-4" />
            Map View
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CreateWorkOrderDialog
            onCreated={(event) => {
              setEvents((current) => sortEvents([event, ...current], sortDescending));
              setSelectedEvent(event);
              setDrawerOpen(true);
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

      {viewMode === "dashboard" ? (
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
              selectedEventId={selectedEvent?.id}
              onSelectEvent={(event) => {
                setSelectedEvent(event);
                setDrawerOpen(true);
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
      ) : (
        <div className="space-y-3">
          <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
            <Widget
              title="Work Orders"
              subtitle="Keyboard accessible list"
              loading={loading}
              emptyState="No work orders are available."
              footer={<span>Press Enter on a row to open the drawer.</span>}
              maxBodyHeight="calc(100vh - 270px)"
            >
              <WorkOrdersTable
                events={events}
                selectedEventId={selectedEvent?.id}
                onSelectEvent={(event) => {
                  setSelectedEvent(event);
                  setDrawerOpen(true);
                }}
                sortDescending={sortDescending}
                onToggleSort={() => setSortDescending((value) => !value)}
              />
            </Widget>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                <Select value={filters.status ?? "all"} onValueChange={(value) => setFilters((current) => ({ ...current, status: value as EventFilters["status"] }))}>
                  <SelectTrigger className="h-9 w-[160px] rounded-lg border-gray-200 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <div className="w-full max-w-[220px]">
                  <Label className="mb-1 block text-xs text-gray-500">Severity Range</Label>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Input
                      type="range"
                      min={1}
                      max={10}
                      value={filters.severityRange?.[1] ?? 10}
                      onChange={(event) =>
                        setFilters((current) => ({
                          ...current,
                          severityRange: [current.severityRange?.[0] ?? 1, Number(event.target.value)]
                        }))
                      }
                    />
                    <span>{filters.severityRange?.[1] ?? 10}</span>
                  </div>
                </div>
                <Button variant="outline" className="h-9 rounded-lg px-3 text-sm">
                  <LocateFixed className="mr-2 h-4 w-4" />
                  Center on my city
                </Button>
                <button
                  type="button"
                  className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm ${
                    liveUpdates ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-gray-200 bg-white text-gray-600"
                  }`}
                  onClick={() => setLiveUpdates((value) => !value)}
                >
                  <Radio className="h-4 w-4" />
                  Live updates
                </button>
              </div>

              <Widget title="Pothole Map" subtitle="Interactive field view" maxBodyHeight="none" bodyClassName="p-0">
                <PotholeMap
                  events={events}
                  selectedEventId={selectedEvent?.id}
                  onSelectEvent={(eventId) => {
                    setSelectedEvent(events.find((event) => event.id === eventId) ?? null);
                    setDrawerOpen(true);
                  }}
                  showHeatmap={filters.showHeatmap}
                  loading={loading}
                  className="h-[calc(100vh-300px)] rounded-none border-0 shadow-none"
                />
              </Widget>
            </div>
          </div>

          <DrawerPanel
            open={drawerOpen && Boolean(selectedEvent)}
            event={selectedEvent}
            onClose={() => setDrawerOpen(false)}
            onUpdated={(updated) => {
              setSelectedEvent(updated);
              setEvents((current) => current.map((event) => (event.id === updated.id ? updated : event)));
            }}
          />
        </div>
      )}
    </div>
  );
}

function DrawerPanel({
  open,
  event,
  onClose,
  onUpdated
}: {
  open: boolean;
  event: PotholeEvent | null;
  onClose: () => void;
  onUpdated: (event: PotholeEvent) => void;
}) {
  const { pushToast } = useToast();
  const [status, setStatus] = useState<PotholeStatus>("open");
  const [assignedTo, setAssignedTo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!event) {
      return;
    }

    setStatus(event.status);
    setAssignedTo(event.assigned_to ?? "");
  }, [event]);

  if (!event) {
    return null;
  }

  const saveQuickUpdate = async (nextStatus = status) => {
    setSaving(true);
    try {
      const updated = await updatePotholeEvent(event.id, {
        status: nextStatus,
        assigned_to: assignedTo
      });
      onUpdated(updated);
      pushToast({ title: "Work order updated", description: `Status changed to ${updated.status}.` });
    } catch {
      pushToast({ title: "Update failed", description: "Try again in a moment.", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <aside
      className={`fixed inset-y-4 right-4 z-40 w-full max-w-[380px] rounded-2xl border border-gray-200 bg-white shadow-sm transition-transform ${
        open ? "translate-x-0" : "translate-x-[110%]"
      }`}
      aria-hidden={!open}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between border-b border-gray-200 px-4 py-4">
          <div>
            <div className="text-sm font-semibold text-gray-900">Work Order Drawer</div>
            <div className="mt-1 text-xs text-gray-500">{event.id.slice(0, 8)} • {formatDateTime(event.detected_at)}</div>
          </div>
          <Button variant="ghost" className="h-8 rounded-md px-2 text-sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          <div className="space-y-2">
            <video controls poster={event.thumbnail_url} className="rounded-lg border border-gray-200">
              <source src={event.clip_url} />
            </video>
            <div className="flex flex-wrap gap-2">
              <SeverityBadge severity={event.severity} />
              <StatusBadge status={event.status} />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="text-xs text-gray-500">AI Draft</div>
            <p className="mt-1 text-sm text-gray-700">{event.description_ai ?? "No AI draft available."}</p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as PotholeStatus)}>
                <SelectTrigger className="h-9 rounded-lg border-gray-200 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Assign</Label>
              <Input className="h-9 rounded-lg border-gray-200 text-sm" value={assignedTo} onChange={(eventInput) => setAssignedTo(eventInput.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button className="h-9 rounded-lg px-3 text-sm" disabled={saving} onClick={() => void saveQuickUpdate()}>
                Save
              </Button>
              <Button
                variant="secondary"
                className="h-9 rounded-lg px-3 text-sm"
                disabled={saving}
                onClick={() => void saveQuickUpdate("resolved")}
              >
                Resolve
              </Button>
              <Button variant="outline" className="h-9 rounded-lg px-3 text-sm" asChild>
                <Link href={`/admin/work-orders/${event.id}`}>Open Full Record</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </aside>
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
