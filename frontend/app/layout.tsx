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

  // If config fails, we still render the app but without the provider
  // Or handle it based on your error boundary setup. We'll provide default empty strings.
  const supabaseUrl = configResult.success ? configResult.config.NEXT_PUBLIC_SUPABASE_URL : "";
  const supabaseKey = configResult.success ? configResult.config.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY : "";
  const googleMapsApiKey = configResult.success ? configResult.config.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY : "";

  return (
    <html lang="en">
      <body className={`${manrope.variable} ${fraunces.variable} font-sans`}>
        <SupabaseProvider supabaseUrl={supabaseUrl} supabaseKey={supabaseKey} googleMapsApiKey={googleMapsApiKey}>
          <AppProvider>{children}</AppProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
