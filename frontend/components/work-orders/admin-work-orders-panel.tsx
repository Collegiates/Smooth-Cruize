"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useSupabase } from "@/components/supabase-provider";
import { WorkOrdersTable } from "@/components/work-orders/work-orders-table";
import { SeverityBadge } from "@/components/work-orders/severity-badge";
import { StatusBadge } from "@/components/work-orders/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast-provider";
import { Widget } from "@/components/ui/widget";
import { getPotholeEvents, updatePotholeEvent } from "@/lib/api/pothole-events";
import type { EventFilters, PotholeEvent, PotholeStatus } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

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

export function AdminWorkOrdersPanel() {
  const { pushToast } = useToast();
  const supabase = useSupabase();
  const [events, setEvents] = useState<PotholeEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<PotholeEvent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortDescending, setSortDescending] = useState(true);

  const refreshEvents = async () => {
    setLoading(true);
    const nextEvents = await getPotholeEvents(initialFilters, supabase);
    const sortedEvents = sortEvents(nextEvents, sortDescending);
    setEvents(sortedEvents);
    setSelectedEvent((current) => sortedEvents.find((event) => event.id === current?.id) ?? sortedEvents[0] ?? null);
    setLoading(false);
  };

  useEffect(() => {
    void refreshEvents();
  }, [sortDescending, supabase]);

  return (
    <div className="space-y-4">
      <Widget
        title="Work Orders"
        subtitle="Keyboard accessible list"
        loading={loading}
        emptyState="No work orders are available."
        footer={<span>Press Enter on a row to open the drawer.</span>}
        maxBodyHeight="calc(100vh - 220px)"
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
          dense={false}
        />
      </Widget>

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
      const updated = await updatePotholeEvent(
        event.id,
        {
          status: nextStatus,
          assigned_to: assignedTo
        },
        supabase
      );
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
            <div className="mt-1 text-xs text-gray-500">
              {event.id.slice(0, 8)} • {formatDateTime(event.detected_at)}
            </div>
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
              <Input
                className="h-9 rounded-lg border-gray-200 text-sm"
                value={assignedTo}
                onChange={(eventInput) => setAssignedTo(eventInput.target.value)}
              />
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
