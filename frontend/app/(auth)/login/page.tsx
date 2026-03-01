import Link from 'next/link'
import { Suspense } from 'react'
import LoginForm from './components/LoginForm'
import SignInWithGoogleButton from './components/SignInWithGoogleButton'

export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                        Welcome back
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Sign in to your account to continue
                    </p>
                </div>

                <div className="rounded-2xl border bg-white p-8 shadow-lg">
                    <SignInWithGoogleButton />

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-white px-4 text-gray-500">or sign in with email</span>
                        </div>
                    </div>

                    <Suspense>
                        <LoginForm />
                    </Suspense>
                </div>

                <p className="mt-6 text-center text-sm text-gray-600">
                    Don&apos;t have an account?{' '}
                    <Link
                        href="/signup"
                        className="font-semibold text-primary transition-colors hover:text-primary/80"
                    >
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    )
}
