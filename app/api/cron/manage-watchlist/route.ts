import { NextResponse } from 'next/server'
import { AutonomousWatchlistManager } from '@/lib/autonomous-watchlist'

/**
 * Autonomous Watchlist Management Cron Job
 * Runs daily to discover new stocks and remove poor performers
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🤖 Starting autonomous watchlist management cron job...')

    const manager = new AutonomousWatchlistManager()
    const result = await manager.manageWatchlist()

    return NextResponse.json({
      message: 'Watchlist management completed',
      result
    })

  } catch (error) {
    console.error('Error in watchlist management cron:', error)
    return NextResponse.json(
      { error: 'Failed to manage watchlist' },
      { status: 500 }
    )
  }
}

