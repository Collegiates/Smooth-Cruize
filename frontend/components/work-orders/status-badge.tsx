import { Badge } from "@/components/ui/badge";
import type { PotholeStatus } from "@/lib/types";

const statusVariantMap: Record<PotholeStatus, "warning" | "success" | "destructive" | "secondary" | "violet"> = {
  open: "warning",
  assigned: "secondary",
  in_progress: "violet",
  resolved: "success",
  rejected: "destructive"
};

export function StatusBadge({ status }: { status: PotholeStatus }) {
  return (
    <Badge className="rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide" variant={statusVariantMap[status]}>
      {status.replace("_", " ")}
    </Badge>
  );
}
