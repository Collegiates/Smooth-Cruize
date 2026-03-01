"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useSession } from "@/hooks/use-session";
import { LeftNav } from "@/components/layout/left-nav";
import { adminNavGroups } from "@/components/layout/navigation-config";
import { TopHeader } from "@/components/layout/top-header";
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

type AppShellProps = {
  title?: string;
  subtitle?: string;
  breadcrumbs?: string[];
  navGroups?: readonly NavGroup[];
  children: React.ReactNode;
};

const routeTitleMap: Record<string, { title: string; breadcrumbs: string[] }> = {
  "/map": { title: "Pothole Map", breadcrumbs: ["Operations", "Map"] },
  "/account": { title: "Account", breadcrumbs: ["User", "Account"] },
  "/login": { title: "Login", breadcrumbs: ["Access", "Login"] },
  "/admin/dashboard": { title: "Dashboard", breadcrumbs: ["Administration", "Dashboard"] }
};

export function AppShell({ title, subtitle, breadcrumbs, navGroups = [], children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { session, signOut } = useSession();

  const derivedMeta = useMemo(() => {
    if (pathname.startsWith("/admin/work-orders/")) {
      return {
        title: "Work Order Detail",
        breadcrumbs: ["Administration", "Work Orders", "Detail"]
      };
    }

    return routeTitleMap[pathname] ?? {
      title: title ?? "Pothole Detects CMMS",
      breadcrumbs: breadcrumbs ?? ["Workspace"]
    };
  }, [breadcrumbs, pathname, title]);

  const effectiveNavGroups = session?.user.isAdmin ? adminNavGroups : navGroups;

  const filteredGroups = effectiveNavGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if ("adminOnly" in item && item.adminOnly && !session?.user.isAdmin) return false;
        if ("guestOnly" in item && item.guestOnly && session) return false;
        return true;
      })
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="min-h-screen text-sm text-foreground">
      <LeftNav
        navGroups={filteredGroups}
        pathname={pathname}
        collapsed={navCollapsed}
        onToggleCollapse={() => setNavCollapsed((value) => !value)}
        mobileOpen={mobileNavOpen}
        onNavigate={() => setMobileNavOpen(false)}
      />

      <div className={navCollapsed ? "md:pl-[84px]" : "md:pl-[260px]"}>
        <TopHeader
          title={derivedMeta.title}
          breadcrumbs={derivedMeta.breadcrumbs}
          subtitle={subtitle}
          onToggleNav={() => setMobileNavOpen((value) => !value)}
          userLabel={session?.profile.full_name ?? "Guest"}
          session={Boolean(session)}
          userMenuOpen={userMenuOpen}
          onToggleUserMenu={() => setUserMenuOpen((value) => !value)}
          onLogout={async () => {
            setUserMenuOpen(false);
            await signOut();
            router.push("/map");
          }}
        />
        <main className="min-h-[calc(100vh-56px)] bg-transparent px-4 pb-5 pt-4">{children}</main>
      </div>
    </div>
  );
}
