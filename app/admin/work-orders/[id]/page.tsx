"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { WorkOrderDetail } from "@/components/work-orders/work-order-detail";
import { Skeleton } from "@/components/ui/skeleton";
import { Widget } from "@/components/ui/widget";
import { getPotholeEventById } from "@/lib/api/pothole-events";
import type { PotholeEvent } from "@/lib/types";

export default function WorkOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [event, setEvent] = useState<PotholeEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const result = await getPotholeEventById(params.id);
      setEvent(result);
      setLoading(false);
    };

    void run();
  }, [params.id]);

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
