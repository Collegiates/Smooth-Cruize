"use client";

import { eachDayOfInterval, endOfDay, format, startOfDay, subDays } from "date-fns";

import { getPotholeEvents } from "@/lib/api/pothole-events";
import type { DailyPotholeStat, DailyPotholeSummary, PotholeEvent } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

type DailyPotholeAnalytics = {
  stats: DailyPotholeStat[];
  summary: DailyPotholeSummary;
};

export async function getDailyPotholeStats(supabase?: SupabaseClient): Promise<DailyPotholeAnalytics> {
  const events = await loadEventsForAnalytics(supabase);

  if (!supabase) {
    return buildMockDailyAnalytics(events);
  }

  return buildDailyAnalytics(events);
}

async function loadEventsForAnalytics(supabase?: SupabaseClient): Promise<PotholeEvent[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from("pothole_events")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    return (data as PotholeEvent[]) ?? [];
  }

  return getPotholeEvents(undefined, supabase);
}

function buildDailyAnalytics(events: PotholeEvent[]): DailyPotholeAnalytics {
  const today = startOfDay(new Date());
  const start = startOfDay(subDays(today, 13));
  const end = endOfDay(today);
  const days = eachDayOfInterval({ start, end });

  const stats = days.map((day) => {
    const dayKey = format(day, "yyyy-MM-dd");
    const reported = events.filter((event) => format(new Date(event.created_at), "yyyy-MM-dd") === dayKey).length;

    // Schema has no resolved_at field, so resolved counts are inferred from records
    // currently in resolved status grouped by their created_at day.
    const resolved = events.filter(
      (event) => event.status === "resolved" && format(new Date(event.created_at), "yyyy-MM-dd") === dayKey
    ).length;

    return {
      date: dayKey,
      label: format(day, "MMM d"),
      reported,
      resolved
    };
  });

  const todayKey = format(today, "yyyy-MM-dd");
  const severityWindowStart = startOfDay(subDays(today, 6)).getTime();
  const recentSeverityEvents = events.filter((event) => new Date(event.created_at).getTime() >= severityWindowStart);
  const averageSeverity7d =
    recentSeverityEvents.length > 0
      ? Number(
        (
          recentSeverityEvents.reduce((sum, event) => sum + event.severity, 0) / recentSeverityEvents.length
        ).toFixed(1)
      )
      : 0;

  const summary: DailyPotholeSummary = {
    newToday: stats.find((item) => item.date === todayKey)?.reported ?? 0,
    resolvedToday: stats.find((item) => item.date === todayKey)?.resolved ?? 0,
    averageSeverity7d,
    openTotal: events.filter((event) => ["open", "assigned", "in_progress"].includes(event.status)).length
  };

  return {
    stats,
    summary
  };
}

function buildMockDailyAnalytics(events: PotholeEvent[]): DailyPotholeAnalytics {
  const today = startOfDay(new Date());
  const start = startOfDay(subDays(today, 13));
  const days = eachDayOfInterval({ start, end: today });

  const stats = days.map((day, index) => {
    const baseline = 3 + (index % 4);
    const reported = baseline + (index % 3 === 0 ? 2 : 0) + (index > 9 ? 1 : 0);
    const resolved = Math.max(1, reported - 2 + (index % 2));

    return {
      date: format(day, "yyyy-MM-dd"),
      label: format(day, "MMM d"),
      reported,
      resolved
    };
  });

  const severityWindowStart = startOfDay(subDays(today, 6)).getTime();
  const recentSeverityEvents = events.filter((event) => new Date(event.created_at).getTime() >= severityWindowStart);
  const averageSeverity7d =
    recentSeverityEvents.length > 0
      ? Number(
        (
          recentSeverityEvents.reduce((sum, event) => sum + event.severity, 0) / recentSeverityEvents.length
        ).toFixed(1)
      )
      : 6.4;

  return {
    stats,
    summary: {
      newToday: stats[stats.length - 1]?.reported ?? 0,
      resolvedToday: stats[stats.length - 1]?.resolved ?? 0,
      averageSeverity7d,
      openTotal: events.filter((event) => ["open", "assigned", "in_progress"].includes(event.status)).length || 18
    }
  };
}
