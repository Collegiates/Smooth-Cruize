"use client"

import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"
import { createContext, useContext, useEffect, useState } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"

type SupabaseContext = {
    supabase: SupabaseClient | undefined
    googleMapsApiKey: string
}

const Context = createContext<SupabaseContext | undefined>(undefined)

export default function SupabaseProvider({
    children,
    supabaseUrl,
    supabaseAnonKey,
    googleMapsApiKey,
}: {
    children: React.ReactNode
    supabaseUrl: string
    supabaseAnonKey: string
    googleMapsApiKey: string
}) {
    const hasValidSupabaseConfig = Boolean(
        supabaseUrl && supabaseAnonKey && supabaseAnonKey.startsWith("eyJ")
    )

    const [supabase] = useState<SupabaseClient | undefined>(() => {
        if (!hasValidSupabaseConfig) {
            return undefined
        }

        try {
            return createBrowserClient(supabaseUrl, supabaseAnonKey)
        } catch {
            return undefined
        }
    })
    const router = useRouter()

    useEffect(() => {
        if (!supabase) {
            return
        }

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(() => {
            router.refresh()
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [router, supabase])

    return (
        <Context.Provider value={{ supabase, googleMapsApiKey }}>
            <>{children}</>
        </Context.Provider>
    )
}

export const useSupabase = () => {
    const context = useContext(Context)
    if (context === undefined) {
        throw new Error("useSupabase must be used inside SupabaseProvider")
    }
    return context.supabase
}

export const useGoogleMapsApiKey = () => {
    const context = useContext(Context)
    if (context === undefined) {
        throw new Error("useGoogleMapsApiKey must be used inside SupabaseProvider")
    }
    return context.googleMapsApiKey
}
