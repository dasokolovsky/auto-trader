import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')
    
    const supabase = getServiceSupabase()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    // Get trades
    const { data: trades } = await supabase
      .from('trades')
      .select('*')
      .gte('executed_at', startDate.toISOString())
      .order('executed_at', { ascending: true })
    
    // Get signals
    const { data: signals } = await supabase
      .from('signal_history')
      .select('*')
      .gte('created_at', startDate.toISOString())
    
    // Get executions
    const { data: executions } = await supabase
      .from('execution_log')
      .select('*')
      .gte('executed_at', startDate.toISOString())
    
    // Get portfolio snapshots
    const { data: snapshots } = await supabase
      .from('portfolio_snapshots')
      .select('*')
      .gte('snapshot_date', startDate.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: true })
    
    // Calculate metrics
    const buyTrades = trades?.filter(t => t.side === 'buy') || []
    const sellTrades = trades?.filter(t => t.side === 'sell') || []
    
    // Match buy/sell pairs
    const completedTrades: Array<{
      ticker: string
      buyDate: string
      sellDate: string
      buyPrice: number
      sellPrice: number
      quantity: number
      profit: number
      profitPercent: number
      buyReason: string
      sellReason: string
    }> = []
    const buysByTicker: Record<string, any[]> = {}
    
    buyTrades.forEach(buy => {
      if (!buysByTicker[buy.ticker]) buysByTicker[buy.ticker] = []
      buysByTicker[buy.ticker].push(buy)
    })
    
    sellTrades.forEach(sell => {
      const buyQueue = buysByTicker[sell.ticker] || []
      if (buyQueue.length > 0) {
        const buy = buyQueue.shift()
        const profit = (parseFloat(sell.price) - parseFloat(buy.price)) * parseFloat(sell.quantity)
        const profitPercent = ((parseFloat(sell.price) - parseFloat(buy.price)) / parseFloat(buy.price)) * 100
        
        completedTrades.push({
          ticker: sell.ticker,
          buyDate: buy.executed_at,
          sellDate: sell.executed_at,
          buyPrice: parseFloat(buy.price),
          sellPrice: parseFloat(sell.price),
          quantity: parseFloat(sell.quantity),
          profit,
          profitPercent,
          buyReason: buy.strategy_params?.reason || 'N/A',
          sellReason: sell.strategy_params?.reason || 'N/A'
        })
      }
    })
    
    const totalProfit = completedTrades.reduce((sum, t) => sum + t.profit, 0)
    const winners = completedTrades.filter(t => t.profit > 0)
    const losers = completedTrades.filter(t => t.profit < 0)
    const winRate = completedTrades.length > 0 ? (winners.length / completedTrades.length) * 100 : 0

    // ENHANCED METRICS

    // Profit Factor = Gross Profit / Gross Loss
    const grossProfit = winners.reduce((sum, t) => sum + t.profit, 0)
    const grossLoss = Math.abs(losers.reduce((sum, t) => sum + t.profit, 0))
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 999 : 0)

    // Average Win/Loss
    const avgWin = winners.length > 0 ? grossProfit / winners.length : 0
    const avgLoss = losers.length > 0 ? grossLoss / losers.length : 0

    // Expectancy = (Win% × Avg Win) - (Loss% × Avg Loss)
    const expectancy = (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss

    // Sharpe Ratio (simplified - using daily returns)
    let sharpeRatio = 0
    if (completedTrades.length > 0) {
      const returns = completedTrades.map(t => t.profitPercent / 100)
      const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
      const stdDev = Math.sqrt(variance)
      if (stdDev > 0) {
        sharpeRatio = (avgReturn / stdDev) * Math.sqrt(252) // Annualized
      }
    }

    // Max Drawdown (from equity curve)
    let maxDrawdown = 0
    let maxDrawdownPercent = 0
    if (completedTrades.length > 0) {
      let equity = 10000 // Starting capital
      let peak = equity
      const equityCurve = [equity]

      completedTrades.forEach(trade => {
        equity += trade.profit
        equityCurve.push(equity)

        if (equity > peak) {
          peak = equity
        }

        const drawdown = peak - equity
        const drawdownPercent = (drawdown / peak) * 100

        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown
          maxDrawdownPercent = drawdownPercent
        }
      })
    }

    // Portfolio performance
    let portfolioReturn = 0
    if (snapshots && snapshots.length > 1) {
      const startValue = parseFloat(snapshots[0].portfolio_value)
      const endValue = parseFloat(snapshots[snapshots.length - 1].portfolio_value)
      portfolioReturn = ((endValue - startValue) / startValue) * 100
    }
    
    return NextResponse.json({
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      },
      activity: {
        totalExecutions: executions?.length || 0,
        marketOpenExecutions: executions?.filter(e => e.market_open).length || 0,
        totalSignals: signals?.length || 0,
        buySignals: signals?.filter(s => s.signal_type === 'BUY').length || 0,
        sellSignals: signals?.filter(s => s.signal_type === 'SELL').length || 0,
        holdSignals: signals?.filter(s => s.signal_type === 'HOLD').length || 0,
        signalsExecuted: signals?.filter(s => s.was_executed).length || 0,
        executionRate: signals?.length ? (signals.filter(s => s.was_executed).length / signals.length) * 100 : 0
      },
      trades: {
        total: trades?.length || 0,
        buys: buyTrades.length,
        sells: sellTrades.length,
        completed: completedTrades.length
      },
      performance: {
        totalProfit,
        winRate,
        winners: winners.length,
        losers: losers.length,
        avgProfit: completedTrades.length > 0 ? totalProfit / completedTrades.length : 0,
        bestTrade: winners.length > 0 ? Math.max(...winners.map(t => t.profit)) : 0,
        worstTrade: losers.length > 0 ? Math.min(...losers.map(t => t.profit)) : 0,
        portfolioReturn,
        // ENHANCED METRICS
        sharpeRatio,
        maxDrawdown,
        maxDrawdownPercent,
        profitFactor,
        expectancy,
        avgWin,
        avgLoss
      },
      completedTrades,
      snapshots
    })
    
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

