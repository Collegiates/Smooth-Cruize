"use client";

import { demoSessions } from "@/lib/mock/pothole-events";
import { getSupabaseBrowserClient, hasSupabaseEnv } from "@/lib/supabase/client";
import { readLocalStorage, storageKeys, writeLocalStorage } from "@/lib/storage";
import type { AppSession, Profile, UserRole } from "@/lib/types";

function buildSessionProfile({
  id,
  email,
  fullName,
  isAdmin
}: {
  id: string;
  email: string;
  fullName?: string | null;
  isAdmin: boolean;
}): Profile {
  return {
    id,
    email,
    full_name: fullName?.trim() || email,
    is_admin: isAdmin
  };
}

export async function getCurrentSession(): Promise<AppSession | null> {
  if (hasSupabaseEnv()) {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return null;
    }

    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session?.user) {
        return null;
      }

      // Try to fetch profile from profiles table; fall back to auth user data
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, role, display_name")
        .eq("id", session.user.id)
        .single();

      const resolvedProfile: Profile = profile
        ? (profile as Profile)
        : {
          id: session.user.id,
          role: "user" as const,
          display_name:
            session.user.user_metadata?.full_name ??
            session.user.email?.split("@")[0] ??
            "User"
        };

      return {
        user: {
          id: session.user.id,
          email: session.user.email ?? "unknown@example.com"
        },
        profile: resolvedProfile,
        source: "supabase"
      };
    } catch {
      // If Supabase calls fail, fall through to demo mode
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("id, email, full_name, is_admin")
      .eq("id", session.user.id)
      .single();
    const email = session.user.email ?? "unknown@example.com";
    const isAdmin = Boolean(profile?.is_admin);

    return {
      user: {
        id: session.user.id,
        email,
        isAdmin
      },
      profile: buildSessionProfile({
        id: session.user.id,
        email,
        fullName: profile?.full_name,
        isAdmin
      }),
      source: "supabase"
    };
  }

  return readLocalStorage<AppSession | null>(storageKeys.mockSessionKey, null);
}

export async function loginWithPassword(email: string, password: string) {
  if (hasSupabaseEnv()) {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      throw new Error("Supabase client unavailable.");
    }

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
      email,
      isAdmin: role === "admin"
    },
    profile: {
      ...session.profile,
      email,
      full_name: role === "admin" ? "Demo Admin" : "Demo User",
      is_admin: role === "admin"
    }
  };

  writeLocalStorage(storageKeys.mockSessionKey, hydratedSession);
}

export async function loginAsDemo(role: UserRole) {
  writeLocalStorage(storageKeys.mockSessionKey, demoSessions[role]);
}

export async function logout() {
  if (hasSupabaseEnv()) {
    const supabase = getSupabaseBrowserClient();

    if (supabase) {
      await supabase.auth.signOut();
    }
  }

  writeLocalStorage(storageKeys.mockSessionKey, null);
}
