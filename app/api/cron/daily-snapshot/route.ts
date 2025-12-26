import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { alpacaClient } from '@/lib/alpaca'

/**
 * Daily portfolio snapshot
 * Should run once per day at market close
 * Captures portfolio value, positions, and calculates returns
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getServiceSupabase()
    
    // Get account info
    const account = await alpacaClient.getAccount()
    const positions = await alpacaClient.getPositions()
    
    const today = new Date().toISOString().split('T')[0]
    
    // Get yesterday's snapshot for calculating daily return
    const { data: yesterdaySnapshot } = await supabase
      .from('portfolio_snapshots')
      .select('*')
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .single()
    
    const portfolioValue = parseFloat(account.portfolio_value)
    const cashBalance = parseFloat(account.cash)
    const equityValue = parseFloat(account.equity)
    
    let dailyReturnPercent = 0
    let cumulativeReturnPercent = 0
    
    if (yesterdaySnapshot) {
      const yesterdayValue = parseFloat(yesterdaySnapshot.portfolio_value)
      dailyReturnPercent = ((portfolioValue - yesterdayValue) / yesterdayValue) * 100
      
      // Assuming starting value of $100,000
      const startingValue = 100000
      cumulativeReturnPercent = ((portfolioValue - startingValue) / startingValue) * 100
    }
    
    // Insert or update today's snapshot
    const { error } = await supabase
      .from('portfolio_snapshots')
      .upsert({
        snapshot_date: today,
        portfolio_value: portfolioValue,
        cash_balance: cashBalance,
        equity_value: equityValue,
        total_positions: positions.length,
        daily_return_percent: dailyReturnPercent,
        cumulative_return_percent: cumulativeReturnPercent,
      }, {
        onConflict: 'snapshot_date'
      })
    
    if (error) throw error
    
    return NextResponse.json({
      message: 'Daily snapshot created',
      snapshot: {
        date: today,
        portfolio_value: portfolioValue,
        daily_return: dailyReturnPercent,
        cumulative_return: cumulativeReturnPercent,
        positions: positions.length
      }
    })
    
  } catch (error) {
    console.error('Error creating daily snapshot:', error)
    return NextResponse.json(
      { error: 'Failed to create snapshot' },
      { status: 500 }
    )
  }
}

