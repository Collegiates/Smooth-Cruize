import { logout } from '@/lib/auth-actions'

export default function LogoutPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-transparent p-4">
            <div className="w-full max-w-sm rounded-2xl border border-cyan-300/25 bg-slate-900/75 p-8 text-center shadow-panel backdrop-blur">
                <h1 className="mb-2 text-2xl font-bold text-slate-100">Sign Out</h1>
                <p className="mb-6 text-sm text-slate-300">
                    Are you sure you want to sign out?
                </p>
                <form action={logout}>
                    <button
                        type="submit"
                        className="w-full rounded-lg bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                    >
                        Sign Out
                    </button>
                </form>
            </div>
        </div>
    )
}
