import { Badge } from "@/components/ui/badge";
import type { PotholeStatus } from "@/lib/types";

const statusVariantMap: Record<PotholeStatus, "default" | "warning" | "success" | "destructive" | "secondary"> = {
  open: "destructive",
  assigned: "default",
  in_progress: "warning",
  resolved: "success",
  rejected: "secondary"
};

export function StatusBadge({ status }: { status: PotholeStatus }) {
  return <Badge className="rounded-sm px-2 py-0 text-[10px] uppercase" variant={statusVariantMap[status]}>{status.replace("_", " ")}</Badge>;
}
