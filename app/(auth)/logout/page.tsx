import { logout } from '@/lib/auth-actions'

export default function LogoutPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-sm rounded-2xl border bg-white p-8 text-center shadow-lg">
                <h1 className="mb-2 text-2xl font-bold text-gray-900">Sign Out</h1>
                <p className="mb-6 text-sm text-gray-600">
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
