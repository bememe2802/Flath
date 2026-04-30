import { NextResponse } from 'next/server'

import { getHomeBff } from '@/src/server/bff'

export async function GET() {
  try {
    const result = await getHomeBff()
    return NextResponse.json({
      code: 1000,
      result
    })
  } catch {
    return NextResponse.json(
      {
        message: 'Unable to load home BFF data right now.'
      },
      { status: 500 }
    )
  }
}
