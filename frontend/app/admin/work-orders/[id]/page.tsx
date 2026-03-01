"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { WorkOrderDetail } from "@/components/work-orders/work-order-detail";
import { Skeleton } from "@/components/ui/skeleton";
import { Widget } from "@/components/ui/widget";
import { useSupabase } from "@/components/supabase-provider";
import { getPotholeEventById } from "@/lib/api/pothole-events";
import type { PotholeEvent } from "@/lib/types";

export default function WorkOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const supabase = useSupabase();
  const [event, setEvent] = useState<PotholeEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const result = await getPotholeEventById(params.id, supabase);
      setEvent(result);
      setLoading(false);
    };

    void run();
  }, [params.id, supabase]);

  if (loading) {
    return <Skeleton className="h-[720px] rounded-lg" />;
  }

  if (!event) {
    return (
      <Widget title="Work Order Detail" emptyState="Work order not found." />
    );
  }

  return <WorkOrderDetail event={event} onUpdated={setEvent} />;
}
