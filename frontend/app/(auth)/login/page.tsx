import Link from 'next/link'
import { Suspense } from 'react'
import LoginForm from './components/LoginForm'
import SignInWithGoogleButton from './components/SignInWithGoogleButton'

export default function LoginPage() {
    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[hsl(222,47%,11%)] p-4">
            {/* Ambient glow blobs */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-32 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[120px]" />
                <div className="absolute bottom-0 left-1/4 h-[400px] w-[500px] rounded-full bg-indigo-600/20 blur-[100px]" />
                <div className="absolute right-0 top-1/3 h-[350px] w-[400px] rounded-full bg-teal-400/10 blur-[90px]" />
            </div>
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-100">
                        Welcome back
                    </h1>
                    <p className="mt-2 text-sm text-slate-300">
                        Sign in to your account to continue
                    </p>
                </div>

                <div className="rounded-2xl border border-cyan-300/25 bg-slate-900/70 p-8 shadow-panel backdrop-blur">
                    <SignInWithGoogleButton />

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-700" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-slate-900 px-4 text-slate-400">or sign in with email</span>
                        </div>
                    </div>

                    <Suspense>
                        <LoginForm />
                    </Suspense>
                </div>

                <p className="mt-6 text-center text-sm text-slate-300">
                    Don&apos;t have an account?{' '}
                    <Link
                        href="/signup"
                        className="font-semibold text-cyan-200 transition-colors hover:text-cyan-100"
                    >
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    )
}
