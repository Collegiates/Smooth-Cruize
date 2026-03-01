"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { useSupabase } from "@/components/supabase-provider";
import { getCurrentSession, loginAsDemo, loginWithPassword, logout } from "@/lib/auth";

import type { AppSession, UserRole } from "@/lib/types";

type SessionContextValue = {
  session: AppSession | null;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInDemo: (role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const supabase = useSupabase();
  const [session, setSession] = useState<AppSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = async () => {
    setIsLoading(true);
    try {
      const nextSession = await getCurrentSession(supabase);
      setSession(nextSession);
    } catch (error) {
      console.error("Failed to refresh session:", error);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const hydrateSession = async () => {
      setIsLoading(true);
      try {
        const nextSession = await getCurrentSession(supabase);
        setSession(nextSession);
      } catch (error) {
        console.error("Failed to hydrate session:", error);
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    };

    void hydrateSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(() => {
      void refreshSession();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const value: SessionContextValue = {
    session,
    isLoading,
    refreshSession,
    signIn: async (email, password) => {
      await loginWithPassword(email, password, supabase);
      await refreshSession();
    },
    signInDemo: async (role) => {
      await loginAsDemo(role);
      await refreshSession();
    },
    signOut: async () => {
      await logout(supabase);
      await refreshSession();
    }
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("useSession must be used inside SessionProvider.");
  }

  return context;
}
