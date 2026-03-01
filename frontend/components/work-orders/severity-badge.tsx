import { Badge } from "@/components/ui/badge";

export function SeverityBadge({ severity }: { severity: number }) {
  const variant = severity >= 8 ? "destructive" : severity >= 5 ? "warning" : "default";
  return <Badge className="rounded-sm px-2 py-0 text-[10px] uppercase" variant={variant}>Severity {severity}</Badge>;
}
