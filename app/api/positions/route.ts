import { NextResponse } from 'next/server'
import { alpacaClient } from '@/lib/alpaca'

export async function GET() {
  try {
    const positions = await alpacaClient.getPositions()
    return NextResponse.json({ positions })
  } catch (error) {
    console.error('Error fetching positions:', error)
    console.error('Error details:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')

    return NextResponse.json(
      {
        error: 'Failed to fetch positions',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

