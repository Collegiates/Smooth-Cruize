export type NavIconName =
  | "layout-dashboard"
  | "map"
  | "clipboard-list"
  | "bar-chart-3"
  | "settings"
  | "user-circle-2"
  | "log-in";

export const adminNavGroups = [
  {
    id: "operations",
    label: "Operations",
    defaultOpen: true,
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: "layout-dashboard" as NavIconName },
      { href: "/map", label: "Map", icon: "map" as NavIconName },
      { href: "/admin/dashboard?view=map", label: "Work Orders", icon: "clipboard-list" as NavIconName }
    ]
  },
  {
    id: "reporting",
    label: "Insights",
    defaultOpen: true,
    items: [{ href: "/admin/dashboard", label: "Reports", icon: "bar-chart-3" as NavIconName }]
  },
  {
    id: "administration",
    label: "Administration",
    defaultOpen: true,
    items: [{ href: "/account", label: "Settings", adminOnly: true, icon: "settings" as NavIconName }]
  }
] as const;

export const publicNavGroups = [
  {
    id: "browse",
    label: "Browse",
    defaultOpen: true,
    items: [
      { href: "/map", label: "Map", icon: "map" as NavIconName },
      { href: "/login", label: "Work Orders", icon: "clipboard-list" as NavIconName }
    ]
  },
  {
    id: "user",
    label: "Account",
    defaultOpen: true,
    items: [
      { href: "/account", label: "Account", icon: "user-circle-2" as NavIconName },
      { href: "/login", label: "Login", icon: "log-in" as NavIconName }
    ]
  }
] as const;
