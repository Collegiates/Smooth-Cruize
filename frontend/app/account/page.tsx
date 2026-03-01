"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { useSupabase } from "@/components/supabase-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { publicNavGroups } from "@/components/layout/navigation-config";
import { useSession } from "@/hooks/use-session";
import type { Profile } from "@/lib/types";

type DatabaseProfile = Pick<Profile, "id" | "email" | "full_name" | "is_admin">;

export default function AccountPage() {
  const router = useRouter();
  const supabase = useSupabase();
  const { session, isLoading, signOut } = useSession();
  const [profile, setProfile] = useState<DatabaseProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!session?.user.id || !supabase) {
        setProfile(session?.profile ?? null);
        return;
      }

      setIsProfileLoading(true);

      const { data, error } = await supabase
        .from("user_profiles")
        .select("id, email, full_name, is_admin")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error || !data) {
        setProfile(session.profile);
      } else {
        setProfile(data as DatabaseProfile);
      }

      setIsProfileLoading(false);
    };

    void loadProfile();
  }, [session, supabase]);

  const activeProfile = profile ?? session?.profile ?? null;

  return (
    <AppShell title="Account" subtitle="Current session, role, and sign-out controls." navGroups={publicNavGroups}>
      {isLoading || isProfileLoading ? (
        <Card className="max-w-2xl">
          <CardContent className="p-8 text-center text-sm text-gray-500">
            Loading account...
          </CardContent>
        </Card>
      ) : session ? (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Current User</CardTitle>
            <CardDescription>Account details are loaded from the `user_profiles` table for the current session.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Display Name</p>
              <p className="mt-1 font-medium">{activeProfile?.full_name ?? session.user.email}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Email</p>
              <p className="mt-1 font-medium">{activeProfile?.email ?? session.user.email}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin Access</p>
              <p className="mt-1 font-medium uppercase">{activeProfile?.is_admin ? "true" : "false"}</p>
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
