"use client";

import { subHours } from "date-fns";

import { mockEvents, mockEventsVersion } from "@/lib/mock/pothole-events";
import { readLocalStorage, storageKeys, writeLocalStorage } from "@/lib/storage";
import type { DashboardMetrics, EventFilters, PotholeEvent } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

function clampSeverity(value: number) {
  return Math.max(1, Math.min(10, Math.round(value)));
}

function normalizeSeverity(record: Record<string, unknown>) {
  const directSeverity = record.severity;

  if (typeof directSeverity === "number" && Number.isFinite(directSeverity)) {
    return clampSeverity(directSeverity);
  }

  const candidateKeys = ["priority", "priority_score", "risk_score", "damage_score", "score", "rating"];

  for (const key of candidateKeys) {
    const value = record[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return clampSeverity(value <= 1 ? value * 10 : value);
    }
  }

  const confidence = typeof record.confidence === "number" && Number.isFinite(record.confidence) ? record.confidence : 0.65;
  return clampSeverity(confidence <= 1 ? confidence * 10 : confidence);
}

function normalizeEvent(record: Record<string, unknown>): PotholeEvent {
  const createdAt =
    typeof record.created_at === "string"
      ? record.created_at
      : typeof record.detected_at === "string"
        ? record.detected_at
        : new Date().toISOString();

  return {
    id: typeof record.id === "string" ? record.id : crypto.randomUUID(),
    created_at: createdAt,
    latitude: typeof record.latitude === "number" ? record.latitude : 0,
    longitude: typeof record.longitude === "number" ? record.longitude : 0,
    detected_at:
      typeof record.detected_at === "string"
        ? record.detected_at
        : createdAt,
    severity: normalizeSeverity(record),
    confidence: typeof record.confidence === "number" && Number.isFinite(record.confidence) ? record.confidence : 0.65,
    status:
      typeof record.status === "string" &&
      ["open", "assigned", "in_progress", "resolved", "rejected"].includes(record.status)
        ? (record.status as PotholeEvent["status"])
        : "open",
    lane_position:
      typeof record.lane_position === "string" &&
      ["left", "center", "right", "unknown"].includes(record.lane_position)
        ? (record.lane_position as PotholeEvent["lane_position"])
        : "unknown",
    description_ai: typeof record.description_ai === "string" ? record.description_ai : "",
    notes_admin: typeof record.notes_admin === "string" ? record.notes_admin : "",
    assigned_to: typeof record.assigned_to === "string" ? record.assigned_to : "",
    clip_url: typeof record.clip_url === "string" ? record.clip_url : "",
    thumbnail_url: typeof record.thumbnail_url === "string" ? record.thumbnail_url : ""
  };
}

type ClipRecord = {
  event_id: string;
  video_url: string;
  captured_at?: string | null;
};

function mergeClipUrls(events: PotholeEvent[], clips: ClipRecord[]) {
  if (events.length === 0 || clips.length === 0) {
    return events;
  }

  const latestClipByEventId = new Map<string, ClipRecord>();

  for (const clip of clips) {
    const current = latestClipByEventId.get(clip.event_id);

    if (!current) {
      latestClipByEventId.set(clip.event_id, clip);
      continue;
    }

    const currentTime = current.captured_at ? new Date(current.captured_at).getTime() : 0;
    const nextTime = clip.captured_at ? new Date(clip.captured_at).getTime() : 0;

    if (nextTime >= currentTime) {
      latestClipByEventId.set(clip.event_id, clip);
    }
  }

  return events.map((event) => {
    if (event.clip_url) {
      return event;
    }

    const matchingClip = latestClipByEventId.get(event.id);

    if (!matchingClip?.video_url) {
      return event;
    }

    return {
      ...event,
      clip_url: matchingClip.video_url
    };
  });
}

async function fetchClipsForEvents(eventIds: string[], supabase: SupabaseClient) {
  if (eventIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("clips")
    .select("event_id, video_url, captured_at")
    .in("event_id", eventIds);

  if (error) {
    console.error("Supabase clip fetch error:", error);
    return [];
  }

  return ((data as ClipRecord[] | null) ?? []).filter(
    (clip) => typeof clip.event_id === "string" && typeof clip.video_url === "string"
  );
}

function getMockEventsStore() {
  const storedVersion = readLocalStorage<number>(storageKeys.mockEventsVersionKey, 0);
  const stored = readLocalStorage<PotholeEvent[]>(storageKeys.mockEventsKey, []);

  if (stored.length > 0 && storedVersion === mockEventsVersion) {
    return stored;
  }

  writeLocalStorage(storageKeys.mockEventsKey, mockEvents);
  writeLocalStorage(storageKeys.mockEventsVersionKey, mockEventsVersion);
  return mockEvents;
}

function setMockEventsStore(events: PotholeEvent[]) {
  writeLocalStorage(storageKeys.mockEventsKey, events);
  writeLocalStorage(storageKeys.mockEventsVersionKey, mockEventsVersion);
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

export async function getPotholeEvents(filters?: EventFilters, supabase?: SupabaseClient): Promise<PotholeEvent[]> {
  if (supabase) {
    let query = supabase.from("pothole_events").select("*").order("created_at", { ascending: false });

    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (filters?.dateFrom) {
      query = query.gte("created_at", filters.dateFrom);
    }

    if (filters?.dateTo) {
      query = query.lte("created_at", filters.dateTo);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase fetch error:", error);
      throw new Error(error.message || "Failed to fetch pothole events");
    }

    const normalizedEvents = ((data as Record<string, unknown>[] | null) ?? []).map(normalizeEvent);
    const clips = await fetchClipsForEvents(
      normalizedEvents.map((event) => event.id),
      supabase
    );

    return applyFilters(mergeClipUrls(normalizedEvents, clips), filters).sort(
      (a, b) => b.severity - a.severity
    );
  }

  const events = getMockEventsStore();
  return applyFilters(events, filters).sort((a, b) => b.severity - a.severity);
}

export async function getPotholeEventById(id: string, supabase?: SupabaseClient): Promise<PotholeEvent | null> {
  if (supabase) {
    const { data, error } = await supabase.from("pothole_events").select("*").eq("id", id).single();

    if (error) {
      throw error;
    }

    const normalizedEvent = normalizeEvent((data as Record<string, unknown>) ?? {});
    const clips = await fetchClipsForEvents([normalizedEvent.id], supabase);
    return mergeClipUrls([normalizedEvent], clips)[0] ?? normalizedEvent;
  }

  return getMockEventsStore().find((event) => event.id === id) ?? null;
}

export async function updatePotholeEvent(
  id: string,
  payload: Partial<PotholeEvent>,
  supabase?: SupabaseClient
): Promise<PotholeEvent> {
  if (supabase) {
    const { data, error } = await supabase
      .from("pothole_events")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return normalizeEvent((data as Record<string, unknown>) ?? {});
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
    Partial<PotholeEvent>,
  supabase?: SupabaseClient
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

  if (supabase) {
    const { data, error } = await supabase.from("pothole_events").insert(draft).select("*").single();

    if (error) {
      throw error;
    }

    return normalizeEvent((data as Record<string, unknown>) ?? {});
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
