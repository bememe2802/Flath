'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import authApiRequest from '@/src/apiRequest/auth'
import profileApiRequest from '@/src/apiRequest/profile'
import { useAppContext } from '@/src/app/app-provider'
import { Button } from '@/src/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from '@/src/components/ui/form'
import { Input } from '@/src/components/ui/input'
import { HttpError } from '@/src/lib/http'
import {
  RegisterBody,
  type RegisterBodyType
} from '@/src/schemaValidations/auth.schema'

export default function RegisterForm() {
  const router = useRouter()
  const { setProfile } = useAppContext()
  const [errorMessage, setErrorMessage] = useState('')

  const form = useForm<RegisterBodyType>({
    resolver: zodResolver(RegisterBody),
    defaultValues: {
      email: '',
      username: '',
      password: '',
      confirmPassword: ''
    }
  })

  async function onSubmit(values: RegisterBodyType) {
    setErrorMessage('')

    try {
      const { confirmPassword, ...registerPayload } = values
      await authApiRequest.register(registerPayload)

      const result = await authApiRequest.login({
        username: values.username,
        password: values.password
      })

      await authApiRequest.auth({
        sessionToken: result.payload.result.token,
        expiresAt:
          result.payload.result.expiryTime ??
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })

      const profileRes = await profileApiRequest.getMyProfile()
      setProfile(profileRes.payload.result)

      router.push('/')
      router.refresh()
    } catch (error) {
      if (error instanceof HttpError) {
        setErrorMessage(error.payload.message ?? 'Unable to create account.')
      } else {
        setErrorMessage('Unable to create account.')
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder="Username"
                  autoComplete="username"
                  className="h-11 rounded-2xl border bg-background"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder="Email"
                  type="email"
                  autoComplete="email"
                  className="h-11 rounded-2xl border bg-background"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder="Password"
                  type="password"
                  autoComplete="new-password"
                  className="h-11 rounded-2xl border bg-background"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder="Confirm password"
                  type="password"
                  autoComplete="new-password"
                  className="h-11 rounded-2xl border bg-background"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {errorMessage ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <Button
          type="submit"
          className="h-11 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
    </Form>
  )
}
