"use client";

import { demoSessions } from "@/lib/mock/pothole-events";
import { readLocalStorage, storageKeys, writeLocalStorage } from "@/lib/storage";
import type { AppSession, Profile, UserRole } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function getCurrentSession(supabase?: SupabaseClient): Promise<AppSession | null> {
  if (supabase) {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return null;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, display_name")
      .eq("id", session.user.id)
      .single();

    if (!profile) {
      return null;
    }

    return {
      user: {
        id: session.user.id,
        email: session.user.email ?? "unknown@example.com"
      },
      profile: profile as Profile,
      source: "supabase"
    };
  }

  return readLocalStorage<AppSession | null>(storageKeys.mockSessionKey, null);
}

export async function loginWithPassword(email: string, password: string, supabase?: SupabaseClient) {
  if (supabase) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      throw error;
    }

    return;
  }

  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  const role: UserRole = email.toLowerCase().includes("admin") ? "admin" : "user";
  const session = demoSessions[role];
  const hydratedSession: AppSession = {
    ...session,
    user: {
      ...session.user,
      email
    },
    profile: {
      ...session.profile,
      email,
      display_name: role === "admin" ? "Demo Admin" : "Demo User"
    }
  };

  writeLocalStorage(storageKeys.mockSessionKey, hydratedSession);
}

export async function loginAsDemo(role: UserRole) {
  writeLocalStorage(storageKeys.mockSessionKey, demoSessions[role]);
}

export async function logout(supabase?: SupabaseClient) {
  if (supabase) {
    await supabase.auth.signOut();
  }

  writeLocalStorage(storageKeys.mockSessionKey, null);
}
