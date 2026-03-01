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
    <section className={cn("overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm", className)}>
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-0.5 truncate text-xs uppercase tracking-wide text-slate-500">{subtitle}</p> : null}
        </div>
        <div className="ml-3 flex items-center gap-1">
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
          <div className={cn("min-h-[120px]", bodyClassName)} style={{ maxHeight: maxBodyHeight, overflow: "auto" }}>
            {loading ? <WidgetSkeleton /> : hasContent ? children : <WidgetEmpty>{emptyState}</WidgetEmpty>}
          </div>
          {footer ? <div className="border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600">{footer}</div> : null}
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
      className="h-8 w-8 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      onClick={onClick}
      aria-label={label}
    >
      {children}
    </Button>
  );
}

function WidgetEmpty({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-[120px] items-center justify-center px-4 py-10 text-sm text-slate-600">
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
