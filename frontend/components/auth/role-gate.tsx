"use client";

import Link from "next/link";

import { useSession } from "@/hooks/use-session";
import type { UserRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type RoleGateProps = {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function RoleGate({ allowedRoles, children, fallback }: RoleGateProps) {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!session || !allowedRoles.includes(session.profile.role)) {
    return (
      fallback ?? (
        <Card>
          <CardHeader>
            <CardTitle>Restricted Route</CardTitle>
            <CardDescription>This area is only available to authorized roles.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/map">Back to map</Link>
            </Button>
          </CardContent>
        </Card>
      )
    );
  }

  return <>{children}</>;
}
