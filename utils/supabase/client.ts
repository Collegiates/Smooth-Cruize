import { createBrowserClient } from '@supabase/ssr'

function isValidKey() {
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    return Boolean(key && key.startsWith('eyJ'))
}

export function createClient() {
    if (!isValidKey()) return null
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    )
}