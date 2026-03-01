"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, RefreshCw, Settings2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type WidgetProps = {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  emptyState?: React.ReactNode;
  loading?: boolean;
  onRefresh?: () => void;
  className?: string;
  bodyClassName?: string;
  defaultCollapsed?: boolean;
  maxBodyHeight?: string;
};

export function Widget({
  title,
  subtitle,
  children,
  footer,
  emptyState,
  loading = false,
  onRefresh,
  className,
  bodyClassName,
  defaultCollapsed = false,
  maxBodyHeight = "420px"
}: WidgetProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const hasContent = Boolean(children);

  return (
    <section className={cn("overflow-hidden rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all hover:border-cyan-400/20", className)}>
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 bg-gradient-to-r from-white/5 to-transparent">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold tracking-wide text-white drop-shadow-sm">{title}</h2>
          {subtitle ? <p className="mt-1 truncate text-xs uppercase tracking-widest text-cyan-200/70">{subtitle}</p> : null}
        </div>
        <div className="ml-3 flex items-center gap-1.5">
          <IconButton label="Refresh" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </IconButton>
          <IconButton label={collapsed ? "Expand widget" : "Collapse widget"} onClick={() => setCollapsed((value) => !value)}>
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </IconButton>
          <IconButton label="Widget settings">
            <Settings2 className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      {!collapsed ? (
        <>
          <div className={cn("min-h-[120px] relative z-10", bodyClassName)} style={{ maxHeight: maxBodyHeight, overflow: "auto" }}>
            {loading ? <WidgetSkeleton /> : hasContent ? children : <WidgetEmpty>{emptyState}</WidgetEmpty>}
          </div>
          {footer ? <div className="border-t border-white/10 bg-white/5 px-5 py-3 text-xs font-medium tracking-wide text-slate-400">{footer}</div> : null}
        </>
      ) : null}
    </section>
  );
}

function IconButton({
  children,
  onClick,
  label
}: {
  children: React.ReactNode;
  onClick?: () => void;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8 rounded-full text-slate-400 hover:bg-cyan-500/20 hover:text-cyan-300 transition-colors"
      onClick={onClick}
      aria-label={label}
    >
      {children}
    </Button>
  );
}

function WidgetEmpty({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-[120px] items-center justify-center px-4 py-10 text-sm font-medium tracking-wide text-slate-500">
      {children ?? "No data available."}
    </div>
  );
}

function WidgetSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <Skeleton className="h-4 w-1/3 rounded-md" />
      <Skeleton className="h-10 w-full rounded-md" />
      <Skeleton className="h-10 w-full rounded-md" />
      <Skeleton className="h-10 w-4/5 rounded-md" />
    </div>
  );
}
