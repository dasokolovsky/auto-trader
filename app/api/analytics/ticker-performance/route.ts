import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    
    const supabase = getServiceSupabase()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    // Get all trades
    const { data: trades } = await supabase
      .from('trades')
      .select('*')
      .gte('executed_at', startDate.toISOString())
      .order('executed_at', { ascending: true })
    
    // Get all signals
    const { data: signals } = await supabase
      .from('signal_history')
      .select('*')
      .gte('created_at', startDate.toISOString())
    
    if (!trades || !signals) {
      return NextResponse.json({ tickers: [] })
    }
    
    // Analyze by ticker
    const tickerStats: Record<string, any> = {}
    
    // Process trades
    const buyTrades: Record<string, any[]> = {}
    trades.forEach(trade => {
      if (!tickerStats[trade.ticker]) {
        tickerStats[trade.ticker] = {
          ticker: trade.ticker,
          totalTrades: 0,
          buys: 0,
          sells: 0,
          totalProfit: 0,
          wins: 0,
          losses: 0,
          avgProfit: 0,
          winRate: 0,
          totalSignals: 0,
          executedSignals: 0,
          avgRSI: 0,
          profitPerTrade: 0,
          score: 0
        }
      }
      
      tickerStats[trade.ticker].totalTrades++
      
      if (trade.side === 'buy') {
        tickerStats[trade.ticker].buys++
        if (!buyTrades[trade.ticker]) buyTrades[trade.ticker] = []
        buyTrades[trade.ticker].push(trade)
      } else {
        tickerStats[trade.ticker].sells++
      }
    })
    
    // Match buy/sell pairs to calculate P/L
    Object.keys(buyTrades).forEach(ticker => {
      const buys = buyTrades[ticker]
      const sells = trades.filter(t => t.ticker === ticker && t.side === 'sell')
      
      sells.forEach(sell => {
        if (buys.length > 0) {
          const buy = buys.shift()
          const profit = (parseFloat(sell.price) - parseFloat(buy.price)) * parseFloat(sell.quantity)
          
          tickerStats[ticker].totalProfit += profit
          if (profit > 0) {
            tickerStats[ticker].wins++
          } else {
            tickerStats[ticker].losses++
          }
        }
      })
    })
    
    // Process signals
    signals.forEach(signal => {
      if (!tickerStats[signal.ticker]) {
        tickerStats[signal.ticker] = {
          ticker: signal.ticker,
          totalTrades: 0,
          buys: 0,
          sells: 0,
          totalProfit: 0,
          wins: 0,
          losses: 0,
          avgProfit: 0,
          winRate: 0,
          totalSignals: 0,
          executedSignals: 0,
          avgRSI: 0,
          profitPerTrade: 0,
          score: 0
        }
      }
      
      tickerStats[signal.ticker].totalSignals++
      if (signal.was_executed) {
        tickerStats[signal.ticker].executedSignals++
      }
      if (signal.rsi) {
        tickerStats[signal.ticker].avgRSI = 
          (tickerStats[signal.ticker].avgRSI * (tickerStats[signal.ticker].totalSignals - 1) + parseFloat(signal.rsi)) / 
          tickerStats[signal.ticker].totalSignals
      }
    })
    
    // Calculate final metrics and score
    Object.values(tickerStats).forEach((stats: any) => {
      const completedTrades = stats.wins + stats.losses
      
      if (completedTrades > 0) {
        stats.winRate = (stats.wins / completedTrades) * 100
        stats.avgProfit = stats.totalProfit / completedTrades
        stats.profitPerTrade = stats.totalProfit / completedTrades
      }
      
      // Calculate score (0-100)
      // Factors: win rate (40%), profit per trade (30%), execution rate (20%), trade volume (10%)
      const winRateScore = stats.winRate * 0.4
      const profitScore = Math.min(Math.max(stats.profitPerTrade / 10, -10), 10) * 3 // -10 to +10 range, scaled to 30
      const executionRate = stats.totalSignals > 0 ? (stats.executedSignals / stats.totalSignals) * 100 : 0
      const executionScore = executionRate * 0.2
      const volumeScore = Math.min(completedTrades / 10, 1) * 10 // Max 10 points for volume
      
      stats.score = Math.max(0, Math.min(100, winRateScore + profitScore + executionScore + volumeScore))
      stats.executionRate = executionRate
    })
    
    // Sort by score
    const rankedTickers = Object.values(tickerStats)
      .filter((stats: any) => stats.totalSignals > 0) // Only include tickers with signals
      .sort((a: any, b: any) => b.score - a.score)
    
    return NextResponse.json({
      tickers: rankedTickers,
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('Error analyzing ticker performance:', error)
    return NextResponse.json(
      { error: 'Failed to analyze tickers' },
      { status: 500 }
    )
  }
}

