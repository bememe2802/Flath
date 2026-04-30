import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const privatePaths = ['/', '/chat', '/global', '/study', '/house', '/league', '/me', '/village']
const authPaths = ['/login', '/register']

function decodeJwtPayload(token: string) {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null

    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/')
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      '='
    )

    return JSON.parse(atob(paddedPayload)) as { exp?: number }
  } catch {
    return null
  }
}

function hasValidSessionToken(token?: string | null) {
  if (!token) return false

  const payload = decodeJwtPayload(token)
  if (!payload) return false

  if (typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now()) {
    return false
  }

  return true
}

async function isSessionTokenUsable(token?: string | null) {
  if (!hasValidSessionToken(token)) {
    return false
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_ENDPOINT}/identity/auth/introspect`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token }),
        cache: 'no-store'
      }
    )

    if (!response.ok) {
      return false
    }

    const payload = (await response.json()) as {
      result?: { valid?: boolean }
    }

    return Boolean(payload.result?.valid)
  } catch {
    return false
  }
}

function clearSessionCookies(response: NextResponse) {
  response.cookies.delete('sessionToken')
  response.cookies.delete('sessionToken_client')
  return response
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    const sessionToken = request.cookies.get('sessionToken')?.value
    const hasValidSession = await isSessionTokenUsable(sessionToken)
    const isPrivatePath = privatePaths.some((path) => pathname === path || pathname.startsWith(path + '/'))
    const isAuthPath = authPaths.some((path) => pathname.startsWith(path))

    if (sessionToken && !hasValidSession) {
        if (isPrivatePath) {
            return clearSessionCookies(
                NextResponse.redirect(new URL('/login', request.url))
            )
        }

        return clearSessionCookies(NextResponse.next())
    }

    if (isPrivatePath && !hasValidSession) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    if (isAuthPath && hasValidSession) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/', '/chat/:path*', '/login', '/register', '/global/:path*', '/study/:path*', '/house/:path*', '/league/:path*', '/me/:path*', '/village/:path*']
}
