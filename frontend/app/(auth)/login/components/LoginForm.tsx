'use client'

import { login } from '@/lib/auth-actions'
import { useFormStatus } from 'react-dom'
import { useSearchParams } from 'next/navigation'

function SubmitButton() {
    const { pending } = useFormStatus()

    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
            {pending ? 'Signing in...' : 'Sign In'}
        </button>
    )
}

export default function LoginForm() {
    const searchParams = useSearchParams()
    const message = searchParams.get('message')

    return (
        <form className="space-y-4" action={login}>
            <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-slate-200">
                    Email
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-lg border border-slate-600 bg-slate-950/70 px-4 py-2.5 text-sm text-slate-100 shadow-sm transition-colors placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/30"
                />
            </div>

            <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-slate-200">
                    Password
                </label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full rounded-lg border border-slate-600 bg-slate-950/70 px-4 py-2.5 text-sm text-slate-100 shadow-sm transition-colors placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/30"
                />
            </div>

            {message && (
                <p className="rounded-lg border border-cyan-300/35 bg-cyan-500/10 px-4 py-2.5 text-sm text-cyan-200">
                    {message}
                </p>
            )}

            <SubmitButton />
        </form>
    )
}
