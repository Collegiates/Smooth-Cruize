export const potholeStatuses = [
  "open",
  "assigned",
  "in_progress",
  "resolved",
  "rejected"
] as const;

export const lanePositions = ["left", "center", "right", "unknown"] as const;

export type PotholeStatus = (typeof potholeStatuses)[number];
export type LanePosition = (typeof lanePositions)[number];
export type UserRole = "user" | "admin";

export type PotholeEvent = {
  id: string;
  created_at: string;
  latitude: number;
  longitude: number;
  detected_at: string;
  severity: number;
  confidence: number;
  status: PotholeStatus;
  lane_position?: LanePosition;
  description_ai?: string;
  notes_admin?: string;
  assigned_to?: string;
  clip_url: string;
  thumbnail_url?: string;
};

export type Profile = {
  id: string;
  role: UserRole;
  display_name: string;
  email?: string;
};

export type SessionUser = {
  id: string;
  email: string;
};

export type AppSession = {
  user: SessionUser;
  profile: Profile;
  source: "supabase" | "demo";
};

export type EventFilters = {
  status?: PotholeStatus | "all";
  severityRange?: [number, number];
  dateFrom?: string;
  dateTo?: string;
  showHeatmap?: boolean;
  search?: string;
};

export type DashboardMetrics = {
  openCount: number;
  averageSeverity: number;
  last24hCount: number;
};

export type DailyPotholeStat = {
  date: string;
  label: string;
  reported: number;
  resolved: number;
};

export type DailyPotholeSummary = {
  newToday: number;
  resolvedToday: number;
  averageSeverity7d: number;
  openTotal: number;
};
