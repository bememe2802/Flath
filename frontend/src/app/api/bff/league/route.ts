import { NextResponse } from 'next/server'

import { getLeagueBff } from '@/src/server/bff'

export async function GET() {
  try {
    const result = await getLeagueBff()
    return NextResponse.json({
      code: 1000,
      result
    })
  } catch {
    return NextResponse.json(
      {
        message: 'Unable to load league BFF data right now.'
      },
      { status: 500 }
    )
  }
}
