import type { AppSession, PotholeEvent } from "@/lib/types";

export const mockEventsVersion = 2;

export const mockEvents: PotholeEvent[] = [
  {
    id: "2c8d9dc2-39ab-4359-8303-c7f72a83c701",
    created_at: "2026-02-28T13:04:00.000Z",
    latitude: 39.6808,
    longitude: -75.7545,
    detected_at: "2026-02-28T13:02:20.000Z",
    severity: 8,
    confidence: 0.93,
    status: "open",
    lane_position: "right",
    description_ai: "Large pothole near curb lane with visible debris around the edge.",
    notes_admin: "",
    assigned_to: "",
    clip_url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    thumbnail_url: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "a0d7ae1c-d7f0-44df-99bf-ccefd31d9d9f",
    created_at: "2026-02-28T11:22:00.000Z",
    latitude: 39.6816,
    longitude: -75.7531,
    detected_at: "2026-02-28T11:20:12.000Z",
    severity: 6,
    confidence: 0.81,
    status: "assigned",
    lane_position: "center",
    description_ai: "Medium-depth pothole in center lane with moderate traffic exposure.",
    notes_admin: "Crew B assigned for evening patch run.",
    assigned_to: "Crew B",
    clip_url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    thumbnail_url: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "0fccfd6d-2411-4650-8439-7f951688810a",
    created_at: "2026-02-28T08:51:00.000Z",
    latitude: 39.6822,
    longitude: -75.7524,
    detected_at: "2026-02-28T08:50:03.000Z",
    severity: 4,
    confidence: 0.72,
    status: "resolved",
    lane_position: "left",
    description_ai: "Shallow pothole, likely already partially filled.",
    notes_admin: "Resolved during overnight maintenance.",
    assigned_to: "Night Ops",
    clip_url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    thumbnail_url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "ef1fdbf2-b5f7-4dba-b192-479568c984d8",
    created_at: "2026-02-27T23:20:00.000Z",
    latitude: 39.6799,
    longitude: -75.7552,
    detected_at: "2026-02-27T23:18:31.000Z",
    severity: 9,
    confidence: 0.97,
    status: "in_progress",
    lane_position: "unknown",
    description_ai: "Severe cavity with likely rim damage risk. Immediate intervention recommended.",
    notes_admin: "Traffic control requested.",
    assigned_to: "Rapid Response 2",
    clip_url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    thumbnail_url: "https://images.unsplash.com/photo-1517021897933-0e0319cfbc28?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "e0c13397-24df-4a54-a937-0b37137b447d",
    created_at: "2026-02-27T18:12:00.000Z",
    latitude: 39.6811,
    longitude: -75.7518,
    detected_at: "2026-02-27T18:11:20.000Z",
    severity: 5,
    confidence: 0.76,
    status: "rejected",
    lane_position: "center",
    description_ai: "Road patch seam misclassified as pothole.",
    notes_admin: "False positive confirmed.",
    assigned_to: "",
    clip_url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnail_url: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "cf2031e0-dfc7-4142-ae66-8d95c4313cf1",
    created_at: "2026-02-28T14:30:00.000Z",
    latitude: 39.6802,
    longitude: -75.7537,
    detected_at: "2026-02-28T14:28:44.000Z",
    severity: 7,
    confidence: 0.88,
    status: "open",
    lane_position: "left",
    description_ai: "Wide pothole impacting left wheel track.",
    notes_admin: "",
    assigned_to: "",
    clip_url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerGame.mp4",
    thumbnail_url: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=900&q=80"
  }
];

export const demoSessions: Record<"admin" | "user", AppSession> = {
  admin: {
    user: {
      id: "demo-admin-id",
      email: "admin@demo.local"
    },
    profile: {
      id: "demo-admin-id",
      role: "admin",
      display_name: "Demo Admin",
      email: "admin@demo.local"
    },
    source: "demo"
  },
  user: {
    user: {
      id: "demo-user-id",
      email: "user@demo.local"
    },
    profile: {
      id: "demo-user-id",
      role: "user",
      display_name: "Demo User",
      email: "user@demo.local"
    },
    source: "demo"
  }
};
