import Link from 'next/link'
import SignUpForm from './components/SignUpForm'

export default function SignUpPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                        Create an account
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Enter your email and password to get started
                    </p>
                </div>

                <div className="rounded-2xl border bg-white p-8 shadow-lg">
                    <SignUpForm />
                </div>

                <p className="mt-6 text-center text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link
                        href="/login"
                        className="font-semibold text-primary transition-colors hover:text-primary/80"
                    >
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    )
}
