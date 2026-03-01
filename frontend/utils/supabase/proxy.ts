import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

type ConfigResult =
    | {
        success: true
        config: {
            NEXT_PUBLIC_SUPABASE_URL: string
            NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: string
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: string
        }
    }
    | {
        success: false
        error: string
        errorType: "BACKEND_DOWN" | "INVALID_RESPONSE" | "NETWORK_ERROR" | "MISSING_ENV_VARS"
    }

async function getSupabaseConfig(): Promise<ConfigResult> {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

        const res = await fetch(`${apiUrl}/api/env`, {
            cache: "no-store",
        })

        if (!res.ok) {
            return {
                success: false,
                error: `Backend error (${res.status})`,
                errorType: "BACKEND_DOWN",
            }
        }

        const data = await res.json()

        if (!data.NEXT_PUBLIC_SUPABASE_URL || !data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
            return {
                success: false,
                error: "Missing Supabase environment variables",
                errorType: "MISSING_ENV_VARS",
            }
        }

        return {
            success: true,
            config: {
                NEXT_PUBLIC_SUPABASE_URL: data.NEXT_PUBLIC_SUPABASE_URL,
                NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
                NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: data.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
            },
        }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            errorType: "NETWORK_ERROR",
        }
    }
}

export const updateSession = async (request: NextRequest) => {
    const configResult = await getSupabaseConfig()

    if (!configResult.success) {
        console.error("Proxy middleware: Config error:", configResult.error)
        return NextResponse.next({
            request: {
                headers: request.headers,
            },
        })
    }

    let supabaseResponse = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        configResult.config.NEXT_PUBLIC_SUPABASE_URL,
        configResult.config.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (
        !user &&
        !request.nextUrl.pathname.startsWith("/login") &&
        !request.nextUrl.pathname.startsWith("/signup") &&
        !request.nextUrl.pathname.startsWith("/auth") &&
        !request.nextUrl.pathname.startsWith("/error") &&
        !request.nextUrl.pathname.startsWith("/map") &&
        request.nextUrl.pathname !== "/"
    ) {
        const url = request.nextUrl.clone()
        url.pathname = "/login"
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
