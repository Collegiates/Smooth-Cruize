import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

export default async function LoginLogoutButton() {
    const supabase = await createClient()
    const user = supabase
        ? (await supabase.auth.getUser()).data.user
        : null

    if (user) {
        return (
            <form action="/logout" method="get">
                <button
                    type="submit"
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow"
                >
                    Sign Out
                </button>
            </form>
        )
    }

    return (
        <Link
            href="/login"
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90"
        >
            Sign In
        </Link>
    )
}
