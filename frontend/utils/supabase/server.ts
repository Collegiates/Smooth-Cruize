import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export type ConfigResult =
    | {
        success: true
        config: {
            NEXT_PUBLIC_SUPABASE_URL: string
            NEXT_PUBLIC_SUPABASE_ANON_KEY: string
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: string
        }
    }
    | {
        success: false
        error: string
        errorType: "BACKEND_DOWN" | "INVALID_RESPONSE" | "NETWORK_ERROR" | "MISSING_ENV_VARS"
    }

async function getSupabaseConfig(): Promise<ConfigResult> {
    const localConfig = {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        NEXT_PUBLIC_SUPABASE_ANON_KEY:
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
        NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    }
    const hasLocalSupabaseConfig = Boolean(
        localConfig.NEXT_PUBLIC_SUPABASE_URL && localConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    if (hasLocalSupabaseConfig) {
        return {
            success: true,
            config: localConfig,
        }
    }

    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

        const res = await fetch(`${apiUrl}/api/env`, {
            cache: "no-store",
        })

        if (!res.ok) {
            if (res.status === 404 || res.status >= 500) {
                return {
                    success: false,
                    error: `Backend server error (${res.status}). Ensure the backend is running.`,
                    errorType: "BACKEND_DOWN",
                }
            }
            return {
                success: false,
                error: `HTTP ${res.status}: ${res.statusText}`,
                errorType: "INVALID_RESPONSE",
            }
        }

        const data = await res.json()
        const backendSupabaseKey =
            data.NEXT_PUBLIC_SUPABASE_ANON_KEY || data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ""

        if (!data.NEXT_PUBLIC_SUPABASE_URL || !backendSupabaseKey) {
            if (hasLocalSupabaseConfig) {
                return {
                    success: true,
                    config: localConfig,
                }
            }
            return {
                success: false,
                error: "Backend is missing Supabase environment variables. Check backend/.env file.",
                errorType: "MISSING_ENV_VARS",
            }
        }

        return {
            success: true,
            config: {
                NEXT_PUBLIC_SUPABASE_URL: data.NEXT_PUBLIC_SUPABASE_URL,
                NEXT_PUBLIC_SUPABASE_ANON_KEY: backendSupabaseKey,
                NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: data.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
            },
        }
    } catch (error) {
        if (hasLocalSupabaseConfig) {
            return {
                success: true,
                config: localConfig,
            }
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
            errorType: "NETWORK_ERROR",
        }
    }
}

export async function createClient() {
    const cookieStore = await cookies()
    const configResult = await getSupabaseConfig()

    if (!configResult.success) {
        throw new Error(`Failed to get Supabase config: ${configResult.error}`)
    }

    return createServerClient(
        configResult.config.NEXT_PUBLIC_SUPABASE_URL,
        configResult.config.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options),
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        },
    )
}

export async function getConfigForClient(): Promise<ConfigResult> {
    return getSupabaseConfig()
}
