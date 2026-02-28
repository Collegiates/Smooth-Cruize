"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronDown, Command, HelpCircle, Info, LifeBuoy, Menu, Search } from "lucide-react";

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
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white/90 px-4 backdrop-blur-sm">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg md:hidden"
          onClick={onToggleNav}
          aria-label="Open navigation"
        >
          <Menu className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <div className="truncate text-xs text-gray-500">{breadcrumbs.join(" / ")}</div>
          <div className="flex items-center gap-3">
            <h1 className="truncate text-sm font-semibold text-gray-900">{title}</h1>
            {subtitle ? <span className="hidden truncate text-xs text-gray-500 lg:block">{subtitle}</span> : null}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative hidden lg:block">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            className="h-9 w-64 rounded-lg border-gray-200 bg-gray-50 pl-9 pr-12 text-sm"
            placeholder="Quick search"
            aria-label="Global quick search"
          />
          <span className="pointer-events-none absolute right-3 top-2 text-xs text-gray-400">
            <Command className="inline h-3 w-3" />K
          </span>
        </div>
        <HeaderAction href="/map" label="Help" icon={<HelpCircle className="h-4 w-4" />} />
        <HeaderAction href="/map" label="Support" icon={<LifeBuoy className="h-4 w-4" />} />
        <HeaderAction href="/" label="About" icon={<Info className="h-4 w-4" />} />
        <div className="relative">
          <Button
            variant="outline"
            className="h-9 rounded-lg border-gray-200 bg-white px-3 text-sm shadow-sm"
            onClick={onToggleUserMenu}
            aria-label="Open user menu"
          >
            {userLabel}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
          {userMenuOpen ? (
            <div className="absolute right-0 top-11 z-50 w-44 rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
              <Link href="/account" className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Account
              </Link>
              {session ? (
                <button
                  type="button"
                  className="block w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  onClick={onLogout}
                >
                  Logout
                </button>
              ) : (
                <Link href="/login" className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
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

function HeaderAction({ href, label, icon }: { href: string; label: string; icon: ReactNode }) {
  return (
    <Link
      href={href}
      className="hidden items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm text-gray-600 transition-colors hover:border-gray-200 hover:bg-gray-50 hover:text-gray-900 md:flex"
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
