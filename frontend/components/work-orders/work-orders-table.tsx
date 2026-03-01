"use client";

import { ArrowUpDown } from "lucide-react";

import type { PotholeEvent, PotholeStatus } from "@/lib/types";
import { formatConfidence, formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { SeverityBadge } from "@/components/work-orders/severity-badge";
import { StatusBadge } from "@/components/work-orders/status-badge";

type WorkOrdersTableProps = {
  events: PotholeEvent[];
  selectedEventId?: string;
  onSelectEvent: (event: PotholeEvent) => void;
  sortDescending?: boolean;
  onToggleSort?: () => void;
  statusFilter?: PotholeStatus | "all";
  dense?: boolean;
};

export function WorkOrdersTable({
  events,
  selectedEventId,
  onSelectEvent,
  sortDescending = true,
  onToggleSort,
  dense = true
}: WorkOrdersTableProps) {
  return (
    <Table className={dense ? "text-xs" : undefined}>
      <TableHeader>
        <TableRow className="bg-white hover:bg-white">
          <TableHead>
            <Button variant="ghost" className="h-7 rounded-md px-1 text-[11px]" onClick={onToggleSort}>
              Severity
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Detected</TableHead>
          <TableHead>Confidence</TableHead>
          <TableHead>Lane</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.map((event) => (
          <TableRow
            key={event.id}
            className={selectedEventId === event.id ? "cursor-pointer bg-sky-50/80" : "cursor-pointer"}
            onClick={() => onSelectEvent(event)}
            tabIndex={0}
            onKeyDown={(inputEvent) => {
              if (inputEvent.key === "Enter" || inputEvent.key === " ") {
                inputEvent.preventDefault();
                onSelectEvent(event);
              }
            }}
          >
            <TableCell>
              <div className="space-y-1">
                <SeverityBadge severity={sortDescending ? event.severity : event.severity} />
                <p className="text-[11px] text-gray-500">{event.id.slice(0, 8)}</p>
              </div>
            </TableCell>
            <TableCell>
              <StatusBadge status={event.status} />
            </TableCell>
            <TableCell>{formatDateTime(event.detected_at)}</TableCell>
            <TableCell>{formatConfidence(event.confidence)}</TableCell>
            <TableCell className="capitalize">{event.lane_position ?? "unknown"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
