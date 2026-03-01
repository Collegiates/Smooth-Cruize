"use client";

import { SessionProvider } from "@/hooks/use-session";
import { ToastProvider } from "@/components/ui/toast-provider";

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>{children}</ToastProvider>
    </SessionProvider>
  );
}
