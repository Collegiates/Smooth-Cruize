"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, MapPin } from "lucide-react";

import { FiltersBar } from "@/components/maps/filters-bar";
import { PotholeMap } from "@/components/maps/pothole-map";
import { AppShell } from "@/components/layout/app-shell";
import { publicNavGroups } from "@/components/layout/navigation-config";
import { SeverityBadge } from "@/components/work-orders/severity-badge";
import { StatusBadge } from "@/components/work-orders/status-badge";
import { Button } from "@/components/ui/button";
import { Widget } from "@/components/ui/widget";
import { getPotholeEvents } from "@/lib/api/pothole-events";
import type { EventFilters, PotholeEvent } from "@/lib/types";
import { formatConfidence, formatCoordinates, formatDateTime } from "@/lib/utils";
import { useSession } from "@/hooks/use-session";

const initialFilters: EventFilters = {
  status: "all",
  severityRange: [1, 10],
  dateFrom: "",
  dateTo: "",
  showHeatmap: false
};

export default function MapPage() {
  const { session } = useSession();
  const [filters, setFilters] = useState<EventFilters>(initialFilters);
  const [events, setEvents] = useState<PotholeEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const nextEvents = await getPotholeEvents(filters);
      setEvents(nextEvents);
      setSelectedEventId((current) =>
        current && nextEvents.some((event) => event.id === current) ? current : nextEvents[0]?.id
      );
      setLoading(false);
    };

    void run();
  }, [filters]);

  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? null;
  const topIssuesNearby = useMemo(() => [...events].sort((a, b) => b.severity - a.severity).slice(0, 5), [events]);

  return (
    <AppShell title="Pothole Map" subtitle="Public operations view" navGroups={publicNavGroups}>
      <div className="flex min-h-[calc(100vh-90px)] flex-col gap-4">
        <FiltersBar filters={filters} onChange={setFilters} />

        <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Widget
            title="Detection Map"
            subtitle="Summary-only public view"
            loading={loading}
            maxBodyHeight="none"
            bodyClassName="p-0"
            footer={<span>Marker clustering can be added later without changing the event data model.</span>}
          >
            <PotholeMap
              events={events}
              loading={loading}
              selectedEventId={selectedEventId}
              onSelectEvent={setSelectedEventId}
              showHeatmap={filters.showHeatmap}
              className="h-[calc(100vh-220px)] rounded-none border-0 shadow-none"
            />
          </Widget>

          <div className="space-y-4">
            <Widget
              title="Detection Summary"
              subtitle="No video for public users"
              loading={loading}
              emptyState="No pothole events match the current filters."
              maxBodyHeight="360px"
            >
              {selectedEvent ? (
                <div className="space-y-4 p-4">
                  <div className="flex flex-wrap gap-2">
                    <SeverityBadge severity={selectedEvent.severity} />
                    <StatusBadge status={selectedEvent.status} />
                  </div>
                  <div className="grid gap-2">
                    <SummaryRow label="Detected at" value={formatDateTime(selectedEvent.detected_at)} />
                    <SummaryRow label="Confidence" value={formatConfidence(selectedEvent.confidence)} />
                    <SummaryRow label="Lane position" value={selectedEvent.lane_position ?? "unknown"} />
                    <SummaryRow label="Coordinates" value={formatCoordinates(selectedEvent.latitude, selectedEvent.longitude)} />
                  </div>
                  {selectedEvent.description_ai ? (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">AI Summary</p>
                      <p className="text-sm text-gray-700">{selectedEvent.description_ai}</p>
                    </div>
                  ) : null}
                  {!session ? (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-white p-3">
                      <p className="text-sm text-gray-600">Login to access account features. Admin-only workflows remain protected.</p>
                      <Button className="mt-3 h-9 rounded-lg px-3 text-sm" asChild>
                        <Link href="/login">Login</Link>
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </Widget>

            <Widget
              title="Top Issues Nearby"
              subtitle="Highest-severity visible detections"
              loading={loading}
              emptyState="No nearby issues to rank."
              maxBodyHeight="320px"
            >
              <div className="divide-y divide-gray-100">
                {topIssuesNearby.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50"
                    onClick={() => setSelectedEventId(event.id)}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-sky-600" />
                        <span className="text-sm font-medium text-gray-900">Record {event.id.slice(0, 8)}</span>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">{formatCoordinates(event.latitude, event.longitude)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={event.severity} />
                      <ArrowUpRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            </Widget>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-medium capitalize text-gray-900">{value}</p>
    </div>
  );
}
