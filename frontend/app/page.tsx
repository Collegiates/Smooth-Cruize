import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Camera, MapPin, Wrench, Scan } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const steps = [
  {
    number: "01",
    icon: Scan,
    title: "Scan the Streets",
    description:
      "AI continuously analyzes dashcam footage from public service vehicles as they drive their normal routes."
  },
  {
    number: "02",
    icon: Camera,
    title: "Capture the Evidence",
    description:
      "When a pothole is detected, the system automatically clips a 3-second video and grabs the precise GPS coordinates."
  },
  {
    number: "03",
    icon: MapPin,
    title: "Map the Hazard",
    description:
      "The pothole is instantly pinned on a live, interactive city map for your department to review."
  },
  {
    number: "04",
    icon: Wrench,
    title: "Dispatch and Resolve",
    description:
      "Turn detections into action. Assign work orders to repair crews, and track progress all from one dashboard."
  }
];

const features = [
  {
    emoji: "📹",
    title: "Video Evidence, Every Time",
    description:
      "No more guessing based on vague citizen phone calls. Every reported pothole comes with a crisp, 3–5 second video snippet so your team knows exactly what they're dealing with before dispatching a truck."
  },
  {
    emoji: "📍",
    title: "Pinpoint Accuracy",
    description:
      "Drop the clipboards. Every single hazard is automatically logged with exact GPS coordinates, a timestamp, and a severity rating, plotted right onto a live geospatial map of your city."
  },
  {
    emoji: "🛠️",
    title: "Streamlined Work Orders",
    description:
      "We built a management workflow directly into the platform. Admins can review incoming detections, convert them into assigned work orders, and track repair status until the road is smooth again."
  }
];

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-16 lg:px-6">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-8">
          {/* Logo */}
          <Link href="/">
            <Image
              src="/SmoothCruize.png"
              alt="Smooth Cruize"
              width={220}
              height={80}
              className="h-20 w-auto object-contain"
              priority
            />
          </Link>

          <div className="space-y-5">
            <h1 className="max-w-3xl font-display text-5xl leading-tight text-slate-100 lg:text-6xl">
              Find the potholes{" "}
              <span className="bg-gradient-to-r from-cyan-300 to-teal-400 bg-clip-text text-transparent">
                before the complaints do.
              </span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-slate-300">
              SmoothCruize uses AI and existing public transit cameras to automatically scan roads,
              catching damage instantly and delivering exact locations and video evidence directly to
              your maintenance team&apos;s inbox.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button size="lg" asChild className="gap-2">
              <Link href="/map">
                View Live Map
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Admin Login</Link>
            </Button>
          </div>
        </div>

        {/* Right-side accent card */}
        <Card className="overflow-hidden border border-cyan-300/20 bg-[#061936] text-white shadow-panel">
          <CardContent className="grid gap-4 bg-[radial-gradient(circle_at_top_right,rgba(35,211,219,0.34),transparent_37%),radial-gradient(circle_at_bottom_left,rgba(137,167,233,0.26),transparent_40%),linear-gradient(140deg,#071833,#0b2447_56%,#0a1f3e)] p-8">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-100">Live system status</p>
              <div className="mt-5 space-y-3">
                {[
                  { label: "AI scanning active", dot: "bg-emerald-400" },
                  { label: "Pothole detection running", dot: "bg-emerald-400" },
                  { label: "GPS metadata attached", dot: "bg-emerald-400" },
                  { label: "Work queue synced", dot: "bg-cyan-400" }
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${item.dot} animate-pulse`} />
                    <span className="text-sm text-slate-200">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── How It Works ─────────────────────────────────────── */}
      <section className="mt-24">
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
            How it works
          </p>
          <h2 className="font-display text-3xl text-slate-100 lg:text-4xl">
            SmoothCruize in 4 steps
          </h2>
        </div>

        <div className="relative grid gap-6 md:grid-cols-4">
          {/* Connecting line (desktop) */}
          <div className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent md:block" />

          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="relative flex flex-col items-center text-center">
                {/* Step bubble */}
                <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-300/30 bg-gradient-to-br from-cyan-900/60 to-slate-900/80 shadow-[0_0_24px_rgba(34,211,238,0.18)] backdrop-blur">
                  <Icon className="h-6 w-6 text-cyan-300" />
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border border-cyan-400/60 bg-slate-950 text-[10px] font-bold text-cyan-300">
                    {step.number.replace("0", "")}
                  </span>
                </div>
                <h3 className="mb-2 text-sm font-semibold text-slate-100">{step.title}</h3>
                <p className="text-xs leading-relaxed text-slate-400">{step.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Key Features ─────────────────────────────────────── */}
      <section className="mt-24">
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
            Key features
          </p>
          <h2 className="font-display text-3xl text-slate-100 lg:text-4xl">
            Built for public works teams
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="border border-white/10 bg-slate-900/60 backdrop-blur transition-shadow hover:shadow-[0_0_32px_rgba(34,211,238,0.12)]"
            >
              <CardHeader className="pb-3">
                <span className="mb-2 text-3xl">{feature.emoji}</span>
                <CardTitle className="text-lg text-slate-100">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed text-slate-400">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
