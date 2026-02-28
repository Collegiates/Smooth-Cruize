"use client";

import { SlidersHorizontal } from "lucide-react";

import { potholeStatuses, type EventFilters } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type FiltersBarProps = {
  filters: EventFilters;
  onChange: (filters: EventFilters) => void;
  showSearch?: boolean;
};

export function FiltersBar({ filters, onChange, showSearch = false }: FiltersBarProps) {
  return (
    <div className="border border-slate-300 bg-white">
      <div className="grid gap-2 p-2 lg:grid-cols-6">
        <div className="space-y-2">
          <Label className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Status</Label>
          <Select
            value={filters.status ?? "all"}
            onValueChange={(value) => onChange({ ...filters, status: value as EventFilters["status"] })}
          >
            <SelectTrigger className="h-8 rounded-sm border-slate-400 text-xs">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {potholeStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Min severity</Label>
          <Input
            type="range"
            min={1}
            max={10}
            value={filters.severityRange?.[0] ?? 1}
            onChange={(event) =>
              onChange({
                ...filters,
                severityRange: [Number(event.target.value), filters.severityRange?.[1] ?? 10]
              })
            }
          />
          <p className="text-[11px] text-slate-500">{filters.severityRange?.[0] ?? 1}</p>
        </div>

        <div className="space-y-2">
          <Label className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Max severity</Label>
          <Input
            type="range"
            min={1}
            max={10}
            value={filters.severityRange?.[1] ?? 10}
            onChange={(event) =>
              onChange({
                ...filters,
                severityRange: [filters.severityRange?.[0] ?? 1, Number(event.target.value)]
              })
            }
          />
          <p className="text-[11px] text-slate-500">{filters.severityRange?.[1] ?? 10}</p>
        </div>

        <div className="space-y-2">
          <Label className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Date from</Label>
          <Input
            type="date"
            className="h-8 rounded-sm border-slate-400 text-xs"
            value={filters.dateFrom ?? ""}
            onChange={(event) => onChange({ ...filters, dateFrom: event.target.value || undefined })}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Date to</Label>
          <Input
            type="date"
            className="h-8 rounded-sm border-slate-400 text-xs"
            value={filters.dateTo ?? ""}
            onChange={(event) => onChange({ ...filters, dateTo: event.target.value || undefined })}
          />
        </div>

        <div className="flex flex-col justify-end gap-2">
          {showSearch ? (
            <Input
              placeholder="Search notes or assignment"
              className="h-8 rounded-sm border-slate-400 text-xs"
              value={filters.search ?? ""}
              onChange={(event) => onChange({ ...filters, search: event.target.value })}
            />
          ) : null}
          <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border"
              checked={Boolean(filters.showHeatmap)}
              onChange={(event) => onChange({ ...filters, showHeatmap: event.target.checked })}
            />
            Show heatmap
          </label>
          <Button
            variant="outline"
            className="h-8 rounded-sm border-slate-400 px-2 text-xs"
            onClick={() =>
              onChange({
                status: "all",
                severityRange: [1, 10],
                dateFrom: "",
                dateTo: "",
                showHeatmap: false,
                search: ""
              })
            }
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Reset filters
          </Button>
        </div>
      </div>
    </div>
  );
}
