"use client";

import Link from "next/link";
import { ShieldX } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { AppShell } from "@/components/layout/app-shell";
import { publicNavGroups } from "@/components/layout/navigation-config";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WorkOrdersPage() {
    const { session, isLoading } = useSession();
    const router = useRouter();

    // If the user is an admin, redirect them straight to the admin work orders
    useEffect(() => {
        if (!isLoading && session?.profile.role === "admin") {
            router.replace("/admin/dashboard");
        }
    }, [session, isLoading, router]);

    return (
        <AppShell title="Work Orders" subtitle="CMMS work order management" navGroups={publicNavGroups}>
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
                    <ShieldX className="h-10 w-10 text-red-500" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">Admin Access Required</h2>
                <p className="mt-3 max-w-sm text-sm text-gray-500">
                    Work orders are managed by administrators only. If you need access, contact your system administrator.
                </p>
                <div className="mt-8 flex gap-3">
                    {!session ? (
                        <Button asChild>
                            <Link href="/login">Sign In</Link>
                        </Button>
                    ) : null}
                    <Button variant="outline" asChild>
                        <Link href="/map">Back to Map</Link>
                    </Button>
                </div>
            </div>
        </AppShell>
    );
}
