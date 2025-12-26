import { NextResponse } from 'next/server'
import { alpacaClient } from '@/lib/alpaca'

export async function GET() {
  try {
    const account = await alpacaClient.getAccount()
    return NextResponse.json({ account })
  } catch (error) {
    console.error('Error fetching account:', error)
    console.error('Error details:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')

    return NextResponse.json(
      {
        error: 'Failed to fetch account',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

