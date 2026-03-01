"use client";

import { demoSessions } from "@/lib/mock/pothole-events";
import { readLocalStorage, storageKeys, writeLocalStorage } from "@/lib/storage";
import type { AppSession, Profile, UserRole } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

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

export async function getCurrentSession(supabase?: SupabaseClient): Promise<AppSession | null> {
  if (supabase) {
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session?.user) {
        return null;
      }

      const email = session.user.email ?? "unknown@example.com";
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id, email, full_name, is_admin")
        .eq("id", session.user.id)
        .maybeSingle();
      const isAdmin = Boolean(profile?.is_admin);
      const resolvedProfile: Profile = buildSessionProfile({
        id: session.user.id,
        email,
        fullName: profile?.full_name ?? session.user.user_metadata?.full_name,
        isAdmin
      });

      return {
        user: {
          id: session.user.id,
          email,
          isAdmin
        },
        profile: resolvedProfile,
        source: "supabase"
      };
    } catch {
      return null;
    }
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

export async function logout(supabase?: SupabaseClient) {
  if (supabase) {
    await supabase.auth.signOut();
  }

  writeLocalStorage(storageKeys.mockSessionKey, null);
}
