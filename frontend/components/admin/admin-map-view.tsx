"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Download, LocateFixed, Radio, RefreshCw } from "lucide-react";

import { CreateWorkOrderDialog } from "@/components/work-orders/create-work-order-dialog";
import { FiltersBar } from "@/components/maps/filters-bar";
import { PotholeMap } from "@/components/maps/pothole-map";
import { WorkOrdersTable } from "@/components/work-orders/work-orders-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast-provider";
import { useSupabase } from "@/components/supabase-provider";
import { Widget } from "@/components/ui/widget";
import { exportEventsAsCsv, getPotholeEvents, updatePotholeEvent } from "@/lib/api/pothole-events";
import type { EventFilters, PotholeEvent, PotholeStatus } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { SeverityBadge } from "@/components/work-orders/severity-badge";
import { StatusBadge } from "@/components/work-orders/status-badge";

const initialFilters: EventFilters = {
  status: "all",
  severityRange: [1, 10],
  dateFrom: "",
  dateTo: "",
  showHeatmap: false,
  search: ""
};

function sortEvents(events: PotholeEvent[], sortDescending: boolean) {
  return [...events].sort((a, b) => (sortDescending ? b.severity - a.severity : a.severity - b.severity));
}

export function AdminMapView() {
  const { pushToast } = useToast();
  const supabase = useSupabase();
  const [filters, setFilters] = useState<EventFilters>(initialFilters);
  const [events, setEvents] = useState<PotholeEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<PotholeEvent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortDescending, setSortDescending] = useState(true);
  const [liveUpdates, setLiveUpdates] = useState(true);

  const refreshEvents = async () => {
    setLoading(true);
    const nextEvents = await getPotholeEvents(filters, supabase);
    const sortedEvents = sortEvents(nextEvents, sortDescending);
    setEvents(sortedEvents);
    setSelectedEvent((current) => sortedEvents.find((event) => event.id === current?.id) ?? sortedEvents[0] ?? null);
    setLoading(false);
  };

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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-400">Admin map workspace for live pothole triage and work order assignment.</div>
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

      <FiltersBar filters={filters} onChange={setFilters} showSearch />

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
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-slate-900/80 backdrop-blur-xl p-3">
            <Select value={filters.status ?? "all"} onValueChange={(value) => setFilters((current) => ({ ...current, status: value as EventFilters["status"] }))}>
              <SelectTrigger className="h-9 w-[160px] rounded-lg border-white/10 bg-slate-800 text-slate-100 text-sm">
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
              <Label className="mb-1 block text-xs text-cyan-300/70">Severity Range</Label>
              <div className="flex items-center gap-2 text-xs text-slate-400">
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
            <Button variant="outline" className="h-9 rounded-lg border-white/10 bg-slate-800 px-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white">
              <LocateFixed className="mr-2 h-4 w-4" />
              Center on my city
            </Button>
            <button
              type="button"
              className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm ${liveUpdates
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-400"
                  : "border-white/10 bg-slate-800 text-slate-400"
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
  const supabase = useSupabase();
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
      }, supabase);
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
      className={`fixed inset-y-4 right-4 z-40 w-full max-w-[380px] rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.3)] transition-transform ${open ? "translate-x-0" : "translate-x-[110%]"
        }`}
      aria-hidden={!open}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between border-b border-white/10 px-4 py-4">
          <div>
            <div className="text-sm font-semibold text-slate-100">Work Order Drawer</div>
            <div className="mt-1 text-xs text-slate-400">
              {event.id.slice(0, 8)} • {formatDateTime(event.detected_at)}
            </div>
          </div>
          <Button variant="ghost" className="h-8 rounded-md px-2 text-sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          <div className="space-y-2">
            <video controls poster={event.thumbnail_url} className="rounded-lg border border-white/10">
              <source src={event.clip_url} />
            </video>
            <div className="flex flex-wrap gap-2">
              <SeverityBadge severity={event.severity} />
              <StatusBadge status={event.status} />
            </div>
          </div>

          <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/5 p-3">
            <div className="text-xs font-semibold uppercase tracking-widest text-cyan-400/80">AI Draft</div>
            <p className="mt-1 text-sm text-slate-300">{event.description_ai ?? "No AI draft available."}</p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-cyan-300/70">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as PotholeStatus)}>
                <SelectTrigger className="h-9 rounded-lg border-white/10 bg-slate-800 text-slate-100 text-sm">
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
              <Label className="text-xs text-cyan-300/70">Assign</Label>
              <Input className="h-9 rounded-lg border-white/10 bg-slate-800 text-slate-100 text-sm" value={assignedTo} onChange={(eventInput) => setAssignedTo(eventInput.target.value)} />
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
