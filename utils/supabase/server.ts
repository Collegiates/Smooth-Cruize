import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function isValidKey() {
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    return Boolean(key && key.startsWith('eyJ'))
}

export async function createClient() {
    if (!isValidKey()) return null
    const cookieStore = await cookies()
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
                    } catch {
                        // Called from Server Component — safe to ignore
                    }
                },
            },
        }
    )
}