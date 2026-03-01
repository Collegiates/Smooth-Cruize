import { AppShell } from "@/components/layout/app-shell";
import { adminNavGroups } from "@/components/layout/navigation-config";
import { RoleGate } from "@/components/auth/role-gate";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell title="Administration" subtitle="CMMS operations console" navGroups={adminNavGroups}>
      <RoleGate allowedRoles={["admin"]}>{children}</RoleGate>
    </AppShell>
  );
}
