import { AlertTriangle, Clock3, Gauge } from "lucide-react";

import type { DashboardMetrics } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AnalyticsCards({ metrics }: { metrics: DashboardMetrics }) {
  const cards = [
    {
      label: "Active Work Orders",
      value: metrics.openCount,
      icon: AlertTriangle
    },
    {
      label: "Average Severity",
      value: metrics.averageSeverity,
      icon: Gauge
    },
    {
      label: "Detections (24h)",
      value: metrics.last24hCount,
      icon: Clock3
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold">{card.label}</CardTitle>
            <card.icon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
