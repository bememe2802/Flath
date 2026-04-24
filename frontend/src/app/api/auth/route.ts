import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const res = await request.json()
    const sessionToken = res.sessionToken
    const expiresAt = res.expiresAt

    if (!sessionToken) {
        return NextResponse.json(
            { message: 'Không nhận được session token' },
            { status: 400 }
        )
    }

    const expireDate = new Date(expiresAt ?? Date.now() + 7 * 24 * 60 * 60 * 1000)
    const response = NextResponse.json({ message: 'Set cookie thành công' })

    response.cookies.set('sessionToken', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires: expireDate
    })

    response.cookies.set('sessionToken_client', sessionToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires: expireDate
    })

    return response
}
