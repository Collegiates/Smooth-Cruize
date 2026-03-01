import Link from 'next/link'
import SignUpForm from './components/SignUpForm'

export default function SignUpPage() {
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
                        Create an account
                    </h1>
                    <p className="mt-2 text-sm text-slate-300">
                        Enter your email and password to get started
                    </p>
                </div>

                <div className="rounded-2xl border border-cyan-300/25 bg-slate-900/70 p-8 shadow-panel backdrop-blur">
                    <SignUpForm />
                </div>

                <p className="mt-6 text-center text-sm text-slate-300">
                    Already have an account?{' '}
                    <Link
                        href="/login"
                        className="font-semibold text-cyan-200 transition-colors hover:text-cyan-100"
                    >
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    )
}
