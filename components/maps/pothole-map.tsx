"use client";

import { CircleF, GoogleMap, LoadScriptNext, MarkerF } from "@react-google-maps/api";
import { MapPinned } from "lucide-react";

import type { PotholeEvent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type PotholeMapProps = {
  events: PotholeEvent[];
  selectedEventId?: string;
  onSelectEvent?: (eventId: string) => void;
  showHeatmap?: boolean;
  loading?: boolean;
  className?: string;
};

const mapContainerStyle = {
  width: "100%",
  height: "100%"
};

const defaultCenter = {
  lat: 39.6812,
  lng: -75.7536
};

export function PotholeMap({
  events,
  selectedEventId,
  onSelectEvent,
  showHeatmap,
  loading,
  className
}: PotholeMapProps) {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (loading) {
    return <Skeleton className={cn("h-[560px] w-full rounded-sm", className)} />;
  }

  if (!googleMapsApiKey) {
    return (
      <div className={cn("h-[560px] overflow-auto border border-slate-300 bg-slate-50", className)}>
        <div className="border-b border-slate-300 bg-slate-100 px-3 py-2 text-xs text-slate-600">
          Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to render the live map. Coordinates remain interactive.
        </div>
        <div className="grid gap-2 p-2">
          {events.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => onSelectEvent?.(event.id)}
              className={cn(
                "flex items-center justify-between border bg-white px-2 py-2 text-left",
                selectedEventId === event.id ? "border-sky-500 bg-sky-50" : "border-slate-300"
              )}
            >
              <div className="flex items-center gap-3">
                <MapPinned className="h-4 w-4 text-sky-700" />
                <div>
                  <p className="text-xs font-medium text-slate-800">Severity {event.severity}</p>
                  <p className="text-[11px] text-slate-500">
                    {event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}
                  </p>
                </div>
              </div>
              <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">{event.status}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <LoadScriptNext googleMapsApiKey={googleMapsApiKey}>
      <LiveMap
        className={className}
        events={events}
        selectedEventId={selectedEventId}
        onSelectEvent={onSelectEvent}
        showHeatmap={showHeatmap}
      />
    </LoadScriptNext>
  );
}

function LiveMap({
  events,
  selectedEventId,
  onSelectEvent,
  showHeatmap,
  className
}: Omit<PotholeMapProps, "loading">) {
  const selectedEvent = events.find((event) => event.id === selectedEventId);

  return (
    <div className={cn("h-[560px] overflow-hidden border border-slate-300 bg-white", className)}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={
          selectedEvent
            ? {
                lat: selectedEvent.latitude,
                lng: selectedEvent.longitude
              }
            : defaultCenter
        }
        zoom={12}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          styles: [
            {
              featureType: "poi",
              stylers: [{ visibility: "off" }]
            }
          ]
        }}
      >
        {events.map((event) => (
          <MarkerF
            key={event.id}
            position={{ lat: event.latitude, lng: event.longitude }}
            onClick={() => onSelectEvent?.(event.id)}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: event.id === selectedEventId ? "#0f766e" : event.severity >= 8 ? "#dc2626" : "#0ea5e9",
              fillOpacity: 0.9,
              strokeColor: "#ffffff",
              strokeWeight: 2,
              scale: event.id === selectedEventId ? 10 : 8
            }}
          />
        ))}

        {showHeatmap
          ? events.map((event) => (
              <CircleF
                key={`${event.id}-heat`}
                center={{ lat: event.latitude, lng: event.longitude }}
                radius={event.severity * 35}
                options={{
                  fillOpacity: 0.12,
                  strokeOpacity: 0,
                  fillColor: event.severity >= 7 ? "#f97316" : "#0ea5e9"
                }}
              />
            ))
          : null}
      </GoogleMap>
    </div>
  );
}
