"use client"

import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"
import { createContext, useContext, useEffect, useState } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"

type SupabaseContext = {
    supabase: SupabaseClient
    googleMapsApiKey: string
}

const Context = createContext<SupabaseContext | undefined>(undefined)

export default function SupabaseProvider({
    children,
    supabaseUrl,
    supabaseKey,
    googleMapsApiKey,
}: {
    children: React.ReactNode
    supabaseUrl: string
    supabaseKey: string
    googleMapsApiKey: string
}) {
    const [supabase] = useState(() =>
        createBrowserClient(supabaseUrl, supabaseKey)
    )
    const router = useRouter()

    useEffect(() => {
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
