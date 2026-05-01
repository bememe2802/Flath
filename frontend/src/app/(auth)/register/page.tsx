import Link from 'next/link'

import RegisterForm from './register-form'

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-10">
      <section className="w-full max-w-sm rounded-xl border bg-card p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">Sign up</h1>
        </div>

        <RegisterForm />

        <div className="mt-4 flex items-center justify-center text-sm text-muted-foreground">
          <span>Have an account?</span>
          <Link href="/login" className="ml-2 text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </section>
    </main>
  )
}
