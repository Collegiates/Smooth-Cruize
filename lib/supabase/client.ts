"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

// Supabase anon keys are JWTs starting with 'eyJ'.
// If the key isn't a JWT, the Supabase client will throw
// uncatchable background promise rejections during auto-refresh.
function isValidSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return Boolean(url && key && key.startsWith('eyJ'));
}

export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !anonKey || !isValidSupabaseConfig()) {
    return null;
  }

  if (!browserClient) {
    try {
      // createBrowserClient uses cookies — same as the server client.
      // This ensures Google OAuth sessions are readable on the client.
      browserClient = createBrowserClient(url, anonKey);
    } catch {
      return null;
    }
  }

  return browserClient;
}

export function hasSupabaseEnv() {
  return isValidSupabaseConfig();
}
