import Link from 'next/link'

import LoginForm from './login-form'

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <section className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Sign in</h1>
        </div>

        <LoginForm />

        <div className="mt-4 flex items-center justify-center text-sm text-gray-600">
          <span>New here?</span>
          <Link href="/register" className="ml-2 text-blue-600 hover:underline">
            Create an account
          </Link>
        </div>
      </section>
    </main>
  )
}
