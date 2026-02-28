"use client";

import { subHours } from "date-fns";

import { getSupabaseBrowserClient, hasSupabaseEnv } from "@/lib/supabase/client";
import { mockEvents } from "@/lib/mock/pothole-events";
import { readLocalStorage, storageKeys, writeLocalStorage } from "@/lib/storage";
import type { DashboardMetrics, EventFilters, PotholeEvent } from "@/lib/types";

function getMockEventsStore() {
  const stored = readLocalStorage<PotholeEvent[]>(storageKeys.mockEventsKey, []);

  if (stored.length > 0) {
    return stored;
  }

  writeLocalStorage(storageKeys.mockEventsKey, mockEvents);
  return mockEvents;
}

function setMockEventsStore(events: PotholeEvent[]) {
  writeLocalStorage(storageKeys.mockEventsKey, events);
}

function applyFilters(events: PotholeEvent[], filters?: EventFilters) {
  if (!filters) {
    return events;
  }

  return events.filter((event) => {
    const matchesStatus =
      !filters.status || filters.status === "all" ? true : event.status === filters.status;
    const matchesSeverity = filters.severityRange
      ? event.severity >= filters.severityRange[0] && event.severity <= filters.severityRange[1]
      : true;
    const detectedAt = new Date(event.detected_at).getTime();
    const matchesDateFrom = filters.dateFrom ? detectedAt >= new Date(filters.dateFrom).getTime() : true;
    const matchesDateTo = filters.dateTo ? detectedAt <= new Date(filters.dateTo).getTime() + 86400000 : true;
    const query = filters.search?.trim().toLowerCase();
    const matchesSearch = query
      ? [event.assigned_to, event.description_ai, event.notes_admin, event.status, event.lane_position]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(query))
      : true;

    return matchesStatus && matchesSeverity && matchesDateFrom && matchesDateTo && matchesSearch;
  });
}

export async function getPotholeEvents(filters?: EventFilters): Promise<PotholeEvent[]> {
  if (hasSupabaseEnv()) {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return [];
    }

    let query = supabase.from("pothole_events").select("*").order("severity", { ascending: false });

    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (filters?.severityRange) {
      query = query.gte("severity", filters.severityRange[0]).lte("severity", filters.severityRange[1]);
    }

    if (filters?.dateFrom) {
      query = query.gte("detected_at", filters.dateFrom);
    }

    if (filters?.dateTo) {
      query = query.lte("detected_at", filters.dateTo);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return (data as PotholeEvent[]) ?? [];
  }

  const events = getMockEventsStore();
  return applyFilters(events, filters).sort((a, b) => b.severity - a.severity);
}

export async function getPotholeEventById(id: string): Promise<PotholeEvent | null> {
  if (hasSupabaseEnv()) {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase!.from("pothole_events").select("*").eq("id", id).single();

    if (error) {
      throw error;
    }

    return data as PotholeEvent;
  }

  return getMockEventsStore().find((event) => event.id === id) ?? null;
}

export async function updatePotholeEvent(
  id: string,
  payload: Partial<PotholeEvent>
): Promise<PotholeEvent> {
  if (hasSupabaseEnv()) {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase!
      .from("pothole_events")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return data as PotholeEvent;
  }

  const events = getMockEventsStore();
  const updatedEvents = events.map((event) => (event.id === id ? { ...event, ...payload } : event));
  const updatedEvent = updatedEvents.find((event) => event.id === id);

  if (!updatedEvent) {
    throw new Error("Work order not found.");
  }

  setMockEventsStore(updatedEvents);
  return updatedEvent;
}

export async function createPotholeEvent(
  payload: Pick<PotholeEvent, "latitude" | "longitude" | "severity" | "status" | "detected_at" | "clip_url"> &
    Partial<PotholeEvent>
) {
  const draft: PotholeEvent = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    lane_position: "unknown",
    confidence: 0.65,
    notes_admin: "",
    assigned_to: "",
    description_ai: "",
    thumbnail_url: "",
    ...payload
  };

  if (hasSupabaseEnv()) {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase!.from("pothole_events").insert(draft).select("*").single();

    if (error) {
      throw error;
    }

    return data as PotholeEvent;
  }

  const events = [draft, ...getMockEventsStore()];
  setMockEventsStore(events);
  return draft;
}

export function getDashboardMetrics(events: PotholeEvent[]): DashboardMetrics {
  const openCount = events.filter((event) =>
    ["open", "assigned", "in_progress"].includes(event.status)
  ).length;
  const averageSeverity =
    events.length > 0 ? Number((events.reduce((sum, event) => sum + event.severity, 0) / events.length).toFixed(1)) : 0;
  const last24hBoundary = subHours(new Date(), 24).getTime();
  const last24hCount = events.filter((event) => new Date(event.detected_at).getTime() >= last24hBoundary).length;

  return {
    openCount,
    averageSeverity,
    last24hCount
  };
}

export function exportEventsAsCsv(events: PotholeEvent[]) {
  const headers = [
    "id",
    "status",
    "severity",
    "confidence",
    "detected_at",
    "latitude",
    "longitude",
    "lane_position",
    "assigned_to"
  ];

  const rows = events.map((event) =>
    [
      event.id,
      event.status,
      event.severity,
      event.confidence,
      event.detected_at,
      event.latitude,
      event.longitude,
      event.lane_position ?? "",
      event.assigned_to ?? ""
    ].join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}
