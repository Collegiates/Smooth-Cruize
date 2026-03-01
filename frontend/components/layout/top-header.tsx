"use client";

import Link from "next/link";
import { ChevronDown, Command, Menu, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TopHeader({
  title,
  breadcrumbs,
  subtitle,
  onToggleNav,
  userLabel,
  session,
  userMenuOpen,
  onToggleUserMenu,
  onLogout
}: {
  title: string;
  breadcrumbs: string[];
  subtitle?: string;
  onToggleNav: () => void;
  userLabel: string;
  session: boolean;
  userMenuOpen: boolean;
  onToggleUserMenu: () => void;
  onLogout: () => Promise<void>;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/10 bg-black/20 px-5 backdrop-blur-xl shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg text-slate-300 hover:text-white md:hidden"
          onClick={onToggleNav}
          aria-label="Open navigation"
        >
          <Menu className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <div className="truncate text-xs text-slate-400">{breadcrumbs.join(" / ")}</div>
          <div className="flex items-center gap-2">
            <h1 className="truncate text-base font-semibold text-slate-100">{title}</h1>
            {subtitle ? <span className="hidden truncate text-xs text-slate-400 lg:block">{subtitle}</span> : null}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="relative hidden lg:block">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            className="h-8 w-64 bg-slate-900/60 pl-9 pr-12 text-sm text-slate-100"
            placeholder="Quick search"
            aria-label="Global quick search"
          />
          <span className="pointer-events-none absolute right-3 top-1.5 text-xs text-slate-400">
            <Command className="inline h-3 w-3" />K
          </span>
        </div>
        <div className="relative">
          <Button
            variant="outline"
            className="h-8 rounded-lg border-cyan-400/30 bg-slate-900/70 px-3 text-sm text-slate-100 hover:bg-slate-800"
            onClick={onToggleUserMenu}
            aria-label="Open user menu"
          >
            {userLabel}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
          {userMenuOpen ? (
            <div className="absolute right-0 top-10 z-50 w-44 rounded-lg border border-border bg-slate-900 p-1 shadow-panel">
              <Link href="/account" className="block rounded-md px-3 py-2 text-sm text-slate-200 hover:bg-slate-800">
                Account
              </Link>
              {session ? (
                <button
                  type="button"
                  className="block w-full rounded-md px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
                  onClick={onLogout}
                >
                  Logout
                </button>
              ) : (
                <Link href="/login" className="block rounded-md px-3 py-2 text-sm text-slate-200 hover:bg-slate-800">
                  Login
                </Link>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
