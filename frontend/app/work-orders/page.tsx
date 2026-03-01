"use client";

import Link from "next/link";

import { RoleGate } from "@/components/auth/role-gate";
import { AppShell } from "@/components/layout/app-shell";
import { publicNavGroups } from "@/components/layout/navigation-config";
import { AdminWorkOrdersPanel } from "@/components/work-orders/admin-work-orders-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function WorkOrdersPage() {
  return (
    <AppShell title="Work Orders" subtitle="CMMS work order management" navGroups={publicNavGroups}>
      <RoleGate
        allowedRoles={["admin"]}
        fallback={
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Admin Access Required</CardTitle>
              <CardDescription>Work orders are managed by administrators only.</CardDescription>
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
        }
      >
        <AdminWorkOrdersPanel />
      </RoleGate>
    </AppShell>
  );
}
