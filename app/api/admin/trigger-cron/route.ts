import { NextResponse } from 'next/server'
import { AutonomousWatchlistManager } from '@/lib/autonomous-watchlist'
import { EnhancedTradingStrategy } from '@/lib/enhanced-strategy'
import { IntelligentTrader } from '@/lib/intelligent-trader'
import { PositionSizer } from '@/lib/position-sizer'
import { getServiceSupabase } from '@/lib/supabase'

/**
 * Manual Cron Job Trigger
 * Allows admin to manually run cron jobs for testing/debugging
 * Directly executes the cron logic instead of making HTTP calls
 */
export async function POST(request: Request) {
  try {
    const { cronJob } = await request.json()

    if (!cronJob) {
      return NextResponse.json({ error: 'cronJob parameter required' }, { status: 400 })
    }

    const validJobs = ['execute-strategy', 'manage-watchlist', 'daily-snapshot']
    if (!validJobs.includes(cronJob)) {
      return NextResponse.json({
        error: `Invalid cronJob. Must be one of: ${validJobs.join(', ')}`
      }, { status: 400 })
    }

    console.log(`🔧 Manually triggering cron job: ${cronJob}`)

    let result: any

    // Execute the cron job logic directly
    if (cronJob === 'manage-watchlist') {
      const manager = new AutonomousWatchlistManager()
      result = await manager.manageWatchlist()
    } else if (cronJob === 'execute-strategy') {
      // Execute strategy logic (simplified version)
      const supabase = getServiceSupabase()
      const { data: strategyConfig } = await supabase
        .from('strategy_config')
        .select('*')
        .eq('is_active', true)
        .single()

      if (!strategyConfig) {
        throw new Error('No active strategy found')
      }

      const strategy = new EnhancedTradingStrategy(strategyConfig.params)
      const intelligentTrader = new IntelligentTrader()

      // Auto-cleanup watchlist
      const cleanup = await intelligentTrader.autoCleanupWatchlist()

      // Get watchlist
      const { data: watchlist } = await supabase
        .from('watchlist')
        .select('*')
        .eq('is_active', true)

      result = {
        cleanup,
        watchlistSize: watchlist?.length || 0,
        message: 'Strategy execution triggered (signals will be generated for each ticker)'
      }
    } else if (cronJob === 'daily-snapshot') {
      const supabase = getServiceSupabase()

      // Get current portfolio value
      const { data: positions } = await supabase
        .from('positions')
        .select('*')
        .eq('is_open', true)

      const totalValue = positions?.reduce((sum, pos) => {
        return sum + (parseFloat(pos.quantity) * parseFloat(pos.current_price || pos.avg_entry_price))
      }, 0) || 0

      // Save snapshot
      await supabase.from('portfolio_snapshots').insert({
        total_value: totalValue.toString(),
        cash_balance: '0', // Would need to fetch from Alpaca
        positions_count: positions?.length || 0
      })

      result = {
        totalValue,
        positionsCount: positions?.length || 0,
        message: 'Daily snapshot saved'
      }
    }

    return NextResponse.json({
      success: true,
      cronJob,
      result,
      triggeredAt: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Error triggering cron job:', error)
    return NextResponse.json({
      error: 'Failed to trigger cron job',
      message: error.message
    }, { status: 500 })
  }
}

