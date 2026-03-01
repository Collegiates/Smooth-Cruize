"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import {
  BarChart3,
  ChevronDown,
  ClipboardList,
  LayoutDashboard,
  LogIn,
  LogOut,
  Map,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  UserCircle2,
  Users
} from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { NavIconName } from "@/components/layout/navigation-config";

type NavItem = {
  href: string;
  label: string;
  adminOnly?: boolean;
  icon?: NavIconName;
};

type NavGroup = {
  id: string;
  label: string;
  items: readonly NavItem[];
  defaultOpen?: boolean;
};

const iconMap: Record<NavIconName, ComponentType<{ className?: string }>> = {
  "layout-dashboard": LayoutDashboard,
  map: Map,
  "clipboard-list": ClipboardList,
  "bar-chart-3": BarChart3,
  settings: Settings,
  "user-circle-2": UserCircle2,
  users: Users,
  "log-in": LogIn,
  "log-out": LogOut
};

export function LeftNav({
  navGroups,
  pathname,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onNavigate
}: {
  navGroups: readonly NavGroup[];
  pathname: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onNavigate: () => void;
}) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 border-r border-white/10 bg-black/30 backdrop-blur-2xl transition-all",
        collapsed ? "w-[84px]" : "w-[260px]",
        mobileOpen ? "block" : "hidden md:block"
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border/80 px-4 py-3">
          <div className={cn("min-w-0", collapsed && "hidden")}>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Smooth Cruize</div>
            <div className="mt-1 truncate text-sm font-semibold text-slate-100">Ops Command Center</div>
          </div>
          {!collapsed ? null : <div className="mx-auto text-xs font-medium uppercase tracking-wide text-slate-400">Ops</div>}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-slate-300 hover:bg-slate-800"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {navGroups.map((group) => (
            <NavGroupSection
              key={group.id}
              collapsed={collapsed}
              group={group}
              pathname={pathname}
              onNavigate={onNavigate}
            />
          ))}
        </div>

        <div className="border-t border-border/80 p-3">
          {collapsed ? (
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-slate-300" aria-label="Search navigation">
              <Search className="h-4 w-4" />
            </Button>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">Search</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input className="h-9 bg-slate-900/80 pl-9 text-sm text-slate-100" placeholder="Search records" />
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function NavGroupSection({
  group,
  pathname,
  collapsed,
  onNavigate
}: {
  group: NavGroup;
  pathname: string;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(group.defaultOpen ?? true);

  return (
    <div className="mb-5">
      {!collapsed ? (
        <button
          type="button"
          className="mb-2 flex w-full items-center justify-between px-2 py-1 text-xs font-medium uppercase tracking-wide text-slate-400"
          onClick={() => setOpen((value) => !value)}
        >
          <span>{group.label}</span>
          <ChevronDown className={cn("h-3 w-3 transition-transform", open ? "rotate-0" : "-rotate-90")} />
        </button>
      ) : null}

      {(open || collapsed) && (
        <div className="space-y-1">
          {group.items.map((item) => {
            const matchHref = item.href.split("?")[0];
            const active = pathname === matchHref || pathname.startsWith(`${matchHref}/`);
            const Icon = item.icon ? iconMap[item.icon] : LayoutDashboard;

            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800/85 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50",
                  active && "bg-cyan-500/14 text-cyan-200"
                )}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
              >
                <span
                  className={cn(
                    "absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-transparent transition-all",
                    active && "bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]"
                  )}
                />
                <Icon className={cn("h-4 w-4 shrink-0", active ? "text-cyan-300" : "text-slate-400 group-hover:text-slate-200")} />
                {!collapsed ? <span className="truncate">{item.label}</span> : null}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
