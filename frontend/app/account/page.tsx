"use client";

import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleGate } from "@/components/auth/role-gate";
import { useSession } from "@/hooks/use-session";

export default function AccountPage() {
  const router = useRouter();
  const { session, signOut } = useSession();

  return (
    <AppShell title="Account" subtitle="Current session, role, and sign-out controls.">
      <RoleGate allowedRoles={["user", "admin"]}>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Current User</CardTitle>
            <CardDescription>Role-based navigation is resolved from the active profile record.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Display Name</p>
              <p className="mt-1 font-medium">{session?.profile.display_name}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Email</p>
              <p className="mt-1 font-medium">{session?.user.email}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Role</p>
              <p className="mt-1 font-medium uppercase">{session?.profile.role}</p>
            </div>
            <Button
              onClick={async () => {
                await signOut();
                router.push("/map");
              }}
            >
              Logout
            </Button>
          </CardContent>
        </Card>
      </RoleGate>
    </AppShell>
  );
}
