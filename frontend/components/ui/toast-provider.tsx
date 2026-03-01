"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type Toast = {
  id: string;
  title: string;
  description?: string;
  variant?: "success" | "error";
};

type ToastContextValue = {
  pushToast: (toast: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const value = useMemo<ToastContextValue>(
    () => ({
      pushToast: (toast) => {
        const nextToast = { ...toast, id: crypto.randomUUID() };
        setToasts((current) => [...current, nextToast]);
        window.setTimeout(() => {
          setToasts((current) => current.filter((item) => item.id !== nextToast.id));
        }, 3000);
      }
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
            role="status"
            aria-live="polite"
          >
            {toast.variant === "error" ? (
              <CircleAlert className="mt-0.5 h-4 w-4 text-rose-600" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
            )}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-gray-900">{toast.title}</div>
              {toast.description ? <div className="mt-0.5 text-xs text-gray-600">{toast.description}</div> : null}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-md"
              onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider.");
  }

  return context;
}
