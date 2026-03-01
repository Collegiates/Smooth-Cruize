"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { potholeStatuses, type PotholeEvent } from "@/lib/types";
import { formatCoordinates, formatDateTime, resolveClipUrl } from "@/lib/utils";
import { updatePotholeEvent } from "@/lib/api/pothole-events";
import { PotholeMap } from "@/components/maps/pothole-map";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast-provider";
import { Widget } from "@/components/ui/widget";
import { SeverityBadge } from "@/components/work-orders/severity-badge";
import { StatusBadge } from "@/components/work-orders/status-badge";

const workOrderSchema = z.object({
  status: z.enum(potholeStatuses),
  severity: z.coerce.number().min(1).max(10),
  assigned_to: z.string().max(120),
  notes_admin: z.string().max(1000)
});

type WorkOrderFormValues = z.infer<typeof workOrderSchema>;

type WorkOrderDetailProps = {
  event: PotholeEvent;
  onUpdated?: (event: PotholeEvent) => void;
  compact?: boolean;
};

export function WorkOrderDetail({ event, onUpdated, compact = false }: WorkOrderDetailProps) {
  const { pushToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [resolveConfirmOpen, setResolveConfirmOpen] = useState(false);
  const clipUrl = resolveClipUrl(event);

  const form = useForm<WorkOrderFormValues>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: {
      status: event.status,
      severity: event.severity,
      assigned_to: event.assigned_to ?? "",
      notes_admin: event.notes_admin ?? ""
    }
  });

  useEffect(() => {
    form.reset({
      status: event.status,
      severity: event.severity,
      assigned_to: event.assigned_to ?? "",
      notes_admin: event.notes_admin ?? ""
    });
  }, [event, form]);

  const timeline = useMemo(
    () => [
      { label: "Detected", detail: formatDateTime(event.detected_at), complete: true },
      { label: "Created", detail: formatDateTime(event.created_at), complete: true },
      { label: "Assigned", detail: event.assigned_to || "Awaiting assignment", complete: ["assigned", "in_progress", "resolved"].includes(event.status) },
      { label: "In Progress", detail: event.status === "in_progress" || event.status === "resolved" ? "Field work started" : "Pending", complete: ["in_progress", "resolved"].includes(event.status) },
      { label: "Resolved", detail: event.status === "resolved" ? "Closed out" : "Open", complete: event.status === "resolved" }
    ],
    [event]
  );

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSaving(true);

    try {
      const updated = await updatePotholeEvent(event.id, {
        status: values.status,
        severity: values.severity,
        assigned_to: values.assigned_to,
        notes_admin: values.notes_admin
      });
      onUpdated?.(updated);
      pushToast({ title: "Work order saved", description: `Record ${updated.id.slice(0, 8)} was updated.` });
    } catch {
      pushToast({ title: "Save failed", description: "Try again in a moment.", variant: "error" });
    } finally {
      setIsSaving(false);
    }
  });

  const approveDescription = () => {
    const currentNotes = form.getValues("notes_admin");
    const nextNotes = [currentNotes, event.description_ai].filter(Boolean).join("\n\n");
    form.setValue("notes_admin", nextNotes, { shouldDirty: true });
    pushToast({ title: "AI draft copied", description: "The draft has been added to notes. Save to persist." });
  };

  const markResolved = async () => {
    setIsSaving(true);
    try {
      const updated = await updatePotholeEvent(event.id, { status: "resolved" });
      onUpdated?.(updated);
      pushToast({ title: "Marked resolved", description: `Record ${updated.id.slice(0, 8)} is resolved.` });
    } catch {
      pushToast({ title: "Resolve failed", description: "Try again in a moment.", variant: "error" });
    } finally {
      setIsSaving(false);
      setResolveConfirmOpen(false);
    }
  };

  return (
    <div className={compact ? "space-y-4" : "space-y-5"}>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <MetadataTile label="ID" value={event.id.slice(0, 8)} />
        <MetadataTile label="GPS" value={formatCoordinates(event.latitude, event.longitude)} />
        <MetadataTile label="Detected At" value={formatDateTime(event.detected_at)} />
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="text-xs uppercase tracking-wide text-cyan-300/70">Severity</div>
          <div className="mt-2">
            <SeverityBadge severity={event.severity} />
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="text-xs uppercase tracking-wide text-cyan-300/70">Status</div>
          <div className="mt-2">
            <StatusBadge status={event.status} />
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <Widget title="Clip Evidence" subtitle="Source video snippet" maxBodyHeight="none" bodyClassName="p-4">
            {clipUrl ? (
              <video controls poster={event.thumbnail_url || undefined} className="rounded-lg border border-white/10">
                <source src={clipUrl} />
              </video>
            ) : (
              <div className="rounded-lg border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                No clip evidence is available for this work order.
              </div>
            )}
          </Widget>

          <Widget title="Location Preview" subtitle="Map mini-preview" maxBodyHeight="none" bodyClassName="p-0">
            <PotholeMap
              events={[event]}
              selectedEventId={event.id}
              onSelectEvent={() => undefined}
              className="h-[260px] rounded-none border-0 shadow-none"
            />
          </Widget>

          <Widget title="Status Timeline" subtitle="Lifecycle progression" maxBodyHeight="none" bodyClassName="p-4">
            <div className="space-y-4">
              {timeline.map((item, index) => (
                <div key={item.label} className="relative flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`h-3 w-3 rounded-full ${item.complete ? "bg-cyan-400" : "bg-slate-700"}`} />
                    {index < timeline.length - 1 ? <div className="mt-1 h-10 w-px bg-white/10" /> : null}
                  </div>
                  <div className="pb-2">
                    <div className="text-sm font-medium text-slate-100">{item.label}</div>
                    <div className="text-sm text-slate-400">{item.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </Widget>
        </div>

        <Widget title="CMMS Record" subtitle="Editable maintenance fields" maxBodyHeight="none" bodyClassName="p-4">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-cyan-300/70">Status</Label>
                <Select value={form.watch("status")} onValueChange={(value) => form.setValue("status", value as PotholeEvent["status"])}>
                  <SelectTrigger className="h-9 rounded-lg border-white/10 bg-slate-800 text-slate-100 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {potholeStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-cyan-300/70">Severity</Label>
                <Input className="h-9 rounded-lg border-white/10 bg-slate-800 text-slate-100 text-sm" type="number" min={1} max={10} {...form.register("severity")} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-cyan-300/70">Assigned To</Label>
              <Input className="h-9 rounded-lg border-white/10 bg-slate-800 text-slate-100 text-sm" placeholder="Crew or assignee" {...form.register("assigned_to")} />
            </div>

            <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-cyan-400/80">AI Draft</div>
                  <div className="mt-1 text-sm text-slate-300">{event.description_ai ?? "No AI draft available."}</div>
                </div>
                <Button type="button" variant="outline" className="h-9 rounded-lg px-3 text-sm" onClick={approveDescription}>
                  Use as notes
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-cyan-300/70">Notes</Label>
              <Textarea
                className="min-h-[220px] rounded-lg border-white/10 bg-slate-800 text-slate-100 text-sm"
                placeholder="Maintenance notes, dispatcher updates, and resolution comments."
                {...form.register("notes_admin")}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" className="h-9 rounded-lg px-3 text-sm" disabled={isSaving}>
                Save
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="h-9 rounded-lg px-3 text-sm"
                onClick={() => setResolveConfirmOpen(true)}
                disabled={isSaving}
              >
                Mark Resolved
              </Button>
              <Button type="button" variant="outline" className="h-9 rounded-lg px-3 text-sm" asChild>
                <Link href="/admin/dashboard">Back to dashboard</Link>
              </Button>
            </div>
          </form>
        </Widget>
      </div>

      <Dialog open={resolveConfirmOpen} onOpenChange={setResolveConfirmOpen}>
        <DialogContent className="rounded-lg border-white/10 bg-slate-900 text-slate-100">
          <DialogHeader>
            <DialogTitle>Confirm Resolution</DialogTitle>
            <DialogDescription>
              Marking this work order as resolved will update its status immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button className="h-9 rounded-lg px-3 text-sm" onClick={() => void markResolved()} disabled={isSaving}>
              Confirm
            </Button>
            <Button variant="outline" className="h-9 rounded-lg px-3 text-sm" onClick={() => setResolveConfirmOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetadataTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <div className="text-xs uppercase tracking-wide text-cyan-300/70">{label}</div>
      <div className="mt-1 text-sm font-medium text-slate-100">{value}</div>
    </div>
  );
}
