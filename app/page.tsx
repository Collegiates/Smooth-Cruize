import Link from "next/link";
import { ArrowRight, MapPinned, ShieldCheck, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Video,
    title: "Clip-first detection",
    description: "YOLO flags potholes, then stores a 3-5 second evidence snippet for operator review."
  },
  {
    icon: MapPinned,
    title: "GPS + timestamp mapping",
    description: "Every event lands on a live geospatial map with severity, lane position, and confidence."
  },
  {
    icon: ShieldCheck,
    title: "CMMS workflow",
    description: "Admins triage detections into work orders, assign crews, and track resolution status."
  }
];

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 py-12 lg:px-6">
      <section className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-8">
          <div className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-primary">
            Pothole Detects CMMS
          </div>
          <div className="space-y-4">
            <h1 className="max-w-3xl font-display text-5xl leading-tight lg:text-7xl">
              Road-surface detection turned into an actionable maintenance inbox.
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              YOLO detects potholes, clips evidence, stamps GPS and timestamp metadata, and pushes the event into a CMMS-style workflow for public visibility and admin response.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="/map">
                View Map
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Admin Login</Link>
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden border-none bg-slate-950 text-white shadow-panel">
          <CardContent className="grid gap-4 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.25),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.25),transparent_30%),linear-gradient(135deg,#0f172a,#1e293b)] p-8">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Operational flow</p>
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Detect pothole from edge video stream</div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Generate clip + timestamp + GPS metadata</div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Map event and triage into admin work queue</div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Assign, resolve, or reject from CMMS dashboard</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-16 grid gap-4 md:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className="bg-card/80">
            <CardHeader>
              <feature.icon className="h-5 w-5 text-primary" />
              <CardTitle className="text-2xl">{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>
    </main>
  );
}
