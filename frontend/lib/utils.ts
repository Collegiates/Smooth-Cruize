import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
import { twMerge } from "tailwind-merge";

const localClipFallbacks: Record<string, string> = {
  "989da312-e461-4d14-a949-4f96f25f0976": "/video/pothole_989da312-e461-4d14-a949-4f96f25f0976.mp4",
  "2fa48c94-e431-4584-8b82-0c4ded875364": "/video/pothole_2fa48c94-e431-4584-8b82-0c4ded875364.mp4"
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(value?: string | null) {
  if (!value) {
    return "N/A";
  }

  return format(new Date(value), "MMM d, yyyy h:mm a");
}

export function formatConfidence(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "N/A";
  }

  return `${Math.round(value * 100)}%`;
}

export function formatCoordinates(latitude: number, longitude: number) {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

export function resolveClipUrl(event: { id: string; clip_url?: string | null }) {
  const localClipUrl = localClipFallbacks[event.id];

  if (localClipUrl) {
    return localClipUrl;
  }

  const clipUrl = event.clip_url?.trim();

  if (clipUrl) {
    return clipUrl;
  }

  return null;
}
