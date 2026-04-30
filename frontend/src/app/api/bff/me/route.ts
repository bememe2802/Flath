import { NextResponse } from 'next/server'

import { getMeBff } from '@/src/server/bff'

export async function GET() {
  try {
    const result = await getMeBff()
    return NextResponse.json({
      code: 1000,
      result
    })
  } catch {
    return NextResponse.json(
      {
        message: 'Unable to load profile BFF data right now.'
      },
      { status: 500 }
    )
  }
}
