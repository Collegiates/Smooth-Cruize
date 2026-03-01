import Link from 'next/link'

export default async function ErrorPage({
    searchParams,
}: {
    searchParams: Promise<{ message?: string }>
}) {
    const { message } = await searchParams

    return (
        <div className="flex min-h-screen items-center justify-center bg-transparent p-4">
            <div className="w-full max-w-md rounded-2xl border border-rose-300/30 bg-slate-900/75 p-8 text-center shadow-panel backdrop-blur">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/20">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 text-rose-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                    </svg>
                </div>
                <h1 className="mb-2 text-2xl font-bold text-slate-100">
                    Something went wrong
                </h1>
                <p className="mb-6 text-sm text-slate-300">
                    {message || 'An unexpected error occurred. Please try again.'}
                </p>
                <Link
                    href="/login"
                    className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
                >
                    Back to Login
                </Link>
            </div>
        </div>
    )
}
