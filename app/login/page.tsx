"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/hooks/use-session";
import { hasSupabaseEnv } from "@/lib/supabase/client";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signInDemo } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@demo.local",
      password: "password123"
    }
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await signIn(values.email, values.password);
      router.push(values.email.includes("admin") ? "/admin/dashboard" : "/map");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  });

  const useDemo = async (role: "admin" | "user") => {
    setIsSubmitting(true);
    setError(null);
    await signInDemo(role);
    router.push(role === "admin" ? "/admin/dashboard" : "/map");
  };

  return (
    <AppShell title="Login" subtitle="Authenticate with Supabase or use demo shortcuts.">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="bg-slate-950 text-white">
          <CardHeader>
            <CardTitle className="text-4xl">Route access by role</CardTitle>
            <CardDescription className="text-slate-300">
              Anonymous users can always inspect the public map. Normal users reach `/map` and `/account`. Admins also unlock the CMMS dashboard and work order detail routes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-200">
            <p>`profiles.role` determines UI access.</p>
            <p>If Supabase env vars are missing, demo buttons write a local mock session.</p>
            <Button variant="secondary" asChild>
              <Link href="/map">Continue without login</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>
              {hasSupabaseEnv()
                ? "This form signs in through Supabase email/password auth."
                : "Supabase env vars are missing, so this form falls back to demo session logic."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input placeholder="you@example.com" {...form.register("email")} />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" placeholder="••••••••" {...form.register("password")} />
              </div>
              {error ? <p className="text-sm text-rose-700">{error}</p> : null}
              <Button type="submit" disabled={isSubmitting}>
                Login
              </Button>
            </form>

            <div className="grid gap-3 md:grid-cols-2">
              <Button variant="outline" onClick={() => void useDemo("admin")} disabled={isSubmitting}>
                Demo Admin
              </Button>
              <Button variant="outline" onClick={() => void useDemo("user")} disabled={isSubmitting}>
                Demo User
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
