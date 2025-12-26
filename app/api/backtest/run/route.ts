import { NextResponse } from 'next/server'
import { Backtester } from '@/lib/backtester'

/**
 * Run backtest on a ticker
 * POST /api/backtest/run
 * Body: { ticker: string, days?: number, saveResults?: boolean }
 */
export async function POST(request: Request) {
  try {
    const { ticker, days = 90, saveResults = true } = await request.json()
    
    if (!ticker) {
      return NextResponse.json(
        { error: 'Ticker is required' },
        { status: 400 }
      )
    }
    
    console.log(`Running backtest for ${ticker} (${days} days)...`)
    
    const backtester = new Backtester()
    const result = await backtester.backtestTicker(ticker, days)
    
    // Save results to database if requested
    if (saveResults && result.totalTrades > 0) {
      await backtester.saveBacktestResults(result)
    }
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Backtest error:', error)
    return NextResponse.json(
      { error: 'Failed to run backtest', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Get backtest results for a ticker
 * GET /api/backtest/run?ticker=AAPL
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const ticker = searchParams.get('ticker')
    
    if (!ticker) {
      return NextResponse.json(
        { error: 'Ticker is required' },
        { status: 400 }
      )
    }
    
    const { getServiceSupabase } = await import('@/lib/supabase')
    const supabase = getServiceSupabase()
    
    // Get simulated trades for this ticker
    const { data: trades } = await supabase
      .from('trades')
      .select('*')
      .eq('ticker', ticker)
      .eq('is_simulated', true)
      .order('executed_at', { ascending: true })
    
    if (!trades || trades.length === 0) {
      return NextResponse.json({
        ticker,
        hasData: false,
        message: 'No backtest data found. Run backtest first.'
      })
    }
    
    // Calculate stats
    const buys = trades.filter(t => t.side === 'buy')
    const sells = trades.filter(t => t.side === 'sell')
    
    let wins = 0
    let losses = 0
    let totalProfit = 0
    
    sells.forEach(sell => {
      if (buys.length > 0) {
        const buy = buys.shift()!
        const profit = (parseFloat(sell.price) - parseFloat(buy.price)) * parseFloat(sell.quantity)
        totalProfit += profit
        
        if (profit > 0) wins++
        else losses++
      }
    })
    
    const completedTrades = wins + losses
    const winRate = completedTrades > 0 ? (wins / completedTrades) * 100 : 0
    const avgProfit = completedTrades > 0 ? totalProfit / completedTrades : 0
    
    const winRateScore = winRate * 0.5
    const profitScore = Math.min(Math.max(avgProfit / 10, -10), 10) * 3
    const volumeScore = Math.min(completedTrades / 10, 1) * 20
    const score = Math.max(0, Math.min(100, winRateScore + profitScore + volumeScore))
    
    return NextResponse.json({
      ticker,
      hasData: true,
      totalTrades: trades.length,
      wins,
      losses,
      winRate,
      totalProfit,
      avgProfit,
      score,
      trades: trades.map(t => ({
        date: t.executed_at,
        side: t.side,
        price: parseFloat(t.price),
        quantity: parseFloat(t.quantity)
      }))
    })
    
  } catch (error) {
    console.error('Error fetching backtest results:', error)
    return NextResponse.json(
      { error: 'Failed to fetch backtest results' },
      { status: 500 }
    )
  }
}

