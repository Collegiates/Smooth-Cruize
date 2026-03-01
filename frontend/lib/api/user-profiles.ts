"use client";

export type UserProfileRecord = {
  id: string;
  email: string | null;
  full_name: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};

const demoProfiles: UserProfileRecord[] = [
  {
    id: "demo-admin-id",
    email: "admin@demo.local",
    full_name: "Demo Admin",
    is_admin: true,
    created_at: new Date("2026-02-20T14:00:00.000Z").toISOString(),
    updated_at: new Date("2026-02-28T09:00:00.000Z").toISOString()
  },
  {
    id: "demo-user-id",
    email: "user@demo.local",
    full_name: "Demo User",
    is_admin: false,
    created_at: new Date("2026-02-20T14:05:00.000Z").toISOString(),
    updated_at: new Date("2026-02-28T09:05:00.000Z").toISOString()
  }
];

function getApiUrl() {
  return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
}

export async function getUserProfiles(): Promise<UserProfileRecord[]> {
  if (!process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return demoProfiles;
  }

  const response = await fetch(`${getApiUrl()}/api/user-profiles`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return (await response.json()) as UserProfileRecord[];
}

export async function updateUserProfileAdmin(id: string, isAdmin: boolean): Promise<UserProfileRecord> {
  if (!process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const profile = demoProfiles.find((item) => item.id === id);

    if (!profile) {
      throw new Error("User not found.");
    }

    profile.is_admin = isAdmin;
    profile.updated_at = new Date().toISOString();
    return profile;
  }

  const response = await fetch(`${getApiUrl()}/api/user-profiles/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ is_admin: isAdmin })
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = (await response.json()) as UserProfileRecord[];
  const updated = Array.isArray(data) ? data[0] : (data as unknown as UserProfileRecord | null);

  if (!updated) {
    throw new Error("Backend returned no updated user record.");
  }

  return updated;
}
