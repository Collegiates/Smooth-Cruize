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
    <div className="rounded-xl border border-white/10 bg-slate-900/80 backdrop-blur-xl">
      <div className="grid gap-2 p-3 lg:grid-cols-6">
        <div className="space-y-2">
          <Label className="text-[11px] uppercase tracking-[0.08em] text-cyan-300/70">Status</Label>
          <Select
            value={filters.status ?? "all"}
            onValueChange={(value) => onChange({ ...filters, status: value as EventFilters["status"] })}
          >
            <SelectTrigger className="h-8 rounded-lg border-white/10 bg-slate-800 text-xs text-slate-100">
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
          <Label className="text-[11px] uppercase tracking-[0.08em] text-cyan-300/70">Min severity</Label>
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
          <p className="text-[11px] text-slate-400">{filters.severityRange?.[0] ?? 1}</p>
        </div>

        <div className="space-y-2">
          <Label className="text-[11px] uppercase tracking-[0.08em] text-cyan-300/70">Max severity</Label>
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
          <p className="text-[11px] text-slate-400">{filters.severityRange?.[1] ?? 10}</p>
        </div>

        <div className="space-y-2">
          <Label className="text-[11px] uppercase tracking-[0.08em] text-cyan-300/70">Date from</Label>
          <Input
            type="date"
            className="h-8 rounded-lg border-white/10 bg-slate-800 text-xs text-slate-100"
            value={filters.dateFrom ?? ""}
            onChange={(event) => onChange({ ...filters, dateFrom: event.target.value || undefined })}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[11px] uppercase tracking-[0.08em] text-cyan-300/70">Date to</Label>
          <Input
            type="date"
            className="h-8 rounded-lg border-white/10 bg-slate-800 text-xs text-slate-100"
            value={filters.dateTo ?? ""}
            onChange={(event) => onChange({ ...filters, dateTo: event.target.value || undefined })}
          />
        </div>

        <div className="flex flex-col justify-end gap-2">
          {showSearch ? (
            <Input
              placeholder="Search notes or assignment"
              className="h-8 rounded-lg border-white/10 bg-slate-800 text-xs text-slate-100 placeholder:text-slate-500"
              value={filters.search ?? ""}
              onChange={(event) => onChange({ ...filters, search: event.target.value })}
            />
          ) : null}
          <label className="flex items-center gap-2 text-xs font-medium text-slate-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-white/20"
              checked={Boolean(filters.showHeatmap)}
              onChange={(event) => onChange({ ...filters, showHeatmap: event.target.checked })}
            />
            Show heatmap
          </label>
          <Button
            variant="outline"
            className="h-8 rounded-lg border-white/10 bg-slate-800 px-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white"
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
