"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { createPotholeEvent } from "@/lib/api/pothole-events";
import type { PotholeEvent } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const createWorkOrderSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  severity: z.coerce.number().min(1).max(10),
  clip_url: z.string().url()
});

type CreateWorkOrderDialogProps = {
  onCreated: (event: PotholeEvent) => void;
};

export function CreateWorkOrderDialog({ onCreated }: CreateWorkOrderDialogProps) {
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof createWorkOrderSchema>>({
    resolver: zodResolver(createWorkOrderSchema),
    defaultValues: {
      latitude: 39.6808,
      longitude: -75.7545,
      severity: 5,
      clip_url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
    }
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    const created = await createPotholeEvent({
      latitude: values.latitude,
      longitude: values.longitude,
      severity: values.severity,
      status: "open",
      detected_at: new Date().toISOString(),
      clip_url: values.clip_url
    });

    onCreated(created);
    setOpen(false);
    form.reset();
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Work Order</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Manual Work Order</DialogTitle>
          <DialogDescription>Add a pothole record for manual QA or dispatcher intake.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Latitude</Label>
              <Input type="number" step="0.0001" {...form.register("latitude")} />
            </div>
            <div className="space-y-2">
              <Label>Longitude</Label>
              <Input type="number" step="0.0001" {...form.register("longitude")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Severity</Label>
            <Input type="number" min={1} max={10} {...form.register("severity")} />
          </div>
          <div className="space-y-2">
            <Label>Clip URL</Label>
            <Input placeholder="https://..." {...form.register("clip_url")} />
          </div>
          <div className="flex gap-3">
            <Button type="submit">Create</Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
