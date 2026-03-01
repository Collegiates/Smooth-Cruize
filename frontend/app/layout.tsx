import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";

import { AppProvider } from "@/components/providers/app-provider";

import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans"
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display"
});

export const metadata: Metadata = {
  title: "Pothole Detects CMMS",
  description: "Frontend MVP for pothole detection review and CMMS work order operations."
};

import { getConfigForClient } from "@/utils/supabase/server";
import SupabaseProvider from "@/components/supabase-provider";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const configResult = await getConfigForClient();

  const supabaseUrl = configResult.success ? configResult.config.NEXT_PUBLIC_SUPABASE_URL : "";
  const supabaseAnonKey = configResult.success ? configResult.config.NEXT_PUBLIC_SUPABASE_ANON_KEY : "";
  const googleMapsApiKey = configResult.success ? configResult.config.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY : "";

  return (
    <html lang="en">
      <body className={`${manrope.variable} ${fraunces.variable} font-sans`}>
        <SupabaseProvider supabaseUrl={supabaseUrl} supabaseAnonKey={supabaseAnonKey} googleMapsApiKey={googleMapsApiKey}>
          <AppProvider>{children}</AppProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
