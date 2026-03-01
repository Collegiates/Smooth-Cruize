"use client";

import { getSupabaseBrowserClient, hasSupabaseEnv } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

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

export async function getUserProfiles(supabase?: SupabaseClient): Promise<UserProfileRecord[]> {
  if (!hasSupabaseEnv()) {
    return demoProfiles;
  }

  const client = supabase ?? getSupabaseBrowserClient();

  if (!client) {
    return [];
  }

  const { data, error } = await client
    .from("user_profiles")
    .select("id, email, full_name, is_admin, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data as UserProfileRecord[]) ?? [];
}

export async function updateUserProfileAdmin(id: string, isAdmin: boolean, supabase?: SupabaseClient): Promise<UserProfileRecord> {
  if (!hasSupabaseEnv()) {
    const profile = demoProfiles.find((item) => item.id === id);

    if (!profile) {
      throw new Error("User not found.");
    }

    profile.is_admin = isAdmin;
    profile.updated_at = new Date().toISOString();
    return profile;
  }

  const client = supabase ?? getSupabaseBrowserClient();

  if (!client) {
    throw new Error("Supabase client unavailable.");
  }

  const { data, error } = await client
    .from("user_profiles")
    .update({ is_admin: isAdmin })
    .eq("id", id)
    .select("id, email, full_name, is_admin, created_at, updated_at")
    .single();

  if (error) {
    throw error;
  }

  return data as UserProfileRecord;
}
