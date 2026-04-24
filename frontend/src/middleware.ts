import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const privatePaths = ['/', '/chat', '/global', '/study', '/house', '/league', '/me', '/village']
const authPaths = ['/login', '/register']

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    const sessionToken = request.cookies.get('sessionToken')?.value

    if (privatePaths.some((path) => pathname === path || pathname.startsWith(path + '/')) && !sessionToken) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    if (authPaths.some((path) => pathname.startsWith(path)) && sessionToken) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/', '/chat/:path*', '/login', '/register', '/global/:path*', '/study/:path*', '/house/:path*', '/league/:path*', '/me/:path*', '/village/:path*']
}
