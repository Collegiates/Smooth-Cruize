"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { publicNavGroups } from "@/components/layout/navigation-config";
import { useSession } from "@/hooks/use-session";

export default function AccountPage() {
  const router = useRouter();
  const { session, isLoading, signOut } = useSession();

  return (
    <AppShell title="Account" subtitle="Current session, role, and sign-out controls." navGroups={publicNavGroups}>
      {isLoading ? (
        <Card className="max-w-2xl">
          <CardContent className="p-8 text-center text-sm text-gray-500">
            Loading session...
          </CardContent>
        </Card>
      ) : session ? (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Current User</CardTitle>
            <CardDescription>Role-based navigation is resolved from the active profile record.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Display Name</p>
              <p className="mt-1 font-medium">{session?.profile.full_name}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Email</p>
              <p className="mt-1 font-medium">{session.user.email}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Role</p>
              <p className="mt-1 font-medium uppercase">{currentRole}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin Access</p>
              <p className="mt-1 font-medium uppercase">{session?.profile.is_admin ? "true" : "false"}</p>
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
      ) : (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Sign in to view your account</CardTitle>
            <CardDescription>You need to be logged in to see your account details.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/map">Back to map</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}

