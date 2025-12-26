import { NextResponse } from 'next/server'
import { alpacaClient } from '@/lib/alpaca'
import { EnhancedTradingStrategy } from '@/lib/enhanced-strategy'
import { getServiceSupabase } from '@/lib/supabase'

// Popular liquid stocks across different sectors
const TICKER_UNIVERSE = [
  // Tech
  'AAPL', 'MSFT', 'GOOGL', 'META', 'NVDA', 'AMD', 'INTC', 'TSLA', 'NFLX', 'ADBE',
  // Finance
  'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C',
  // Healthcare
  'JNJ', 'UNH', 'PFE', 'ABBV', 'MRK', 'TMO',
  // Consumer
  'AMZN', 'WMT', 'HD', 'NKE', 'SBUX', 'MCD',
  // Energy
  'XOM', 'CVX', 'COP', 'SLB',
  // Industrial
  'BA', 'CAT', 'GE', 'UPS',
]

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    
    const supabase = getServiceSupabase()
    
    // Get active strategy
    const { data: strategyConfig } = await supabase
      .from('strategy_config')
      .select('*')
      .eq('is_active', true)
      .single()
    
    if (!strategyConfig) {
      return NextResponse.json({ error: 'No active strategy' }, { status: 400 })
    }
    
    const strategy = new EnhancedTradingStrategy(strategyConfig.params)
    
    // Get current watchlist to exclude
    const { data: watchlist } = await supabase
      .from('watchlist')
      .select('ticker')
      .eq('is_active', true)
    
    const watchlistTickers = new Set(watchlist?.map(w => w.ticker) || [])
    
    // Get historical performance data
    const { data: historicalPerf } = await supabase
      .from('trades')
      .select('ticker, side, price, quantity')
      .gte('executed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    
    // Build historical performance map
    const historicalWinners = new Set<string>()
    if (historicalPerf) {
      const buysByTicker: Record<string, any[]> = {}
      historicalPerf.forEach(trade => {
        if (trade.side === 'buy') {
          if (!buysByTicker[trade.ticker]) buysByTicker[trade.ticker] = []
          buysByTicker[trade.ticker].push(trade)
        } else if (trade.side === 'sell' && buysByTicker[trade.ticker]?.length > 0) {
          const buy = buysByTicker[trade.ticker].shift()
          const profit = (parseFloat(trade.price) - parseFloat(buy.price)) * parseFloat(trade.quantity)
          if (profit > 0) {
            historicalWinners.add(trade.ticker)
          }
        }
      })
    }
    
    // Analyze each ticker
    const recommendations = []
    
    for (const ticker of TICKER_UNIVERSE) {
      // Skip if already in watchlist
      if (watchlistTickers.has(ticker)) continue
      
      try {
        // Generate signal for this ticker
        const signal = await strategy.generateSignal(ticker, null)
        
        // Calculate score
        let score = 0
        
        // Factor 1: Current signal strength (40 points)
        if (signal.action === 'buy') {
          score += 40
          // Bonus for strong oversold
          if (signal.indicators?.rsi && signal.indicators.rsi < 25) {
            score += 10
          }
          // Bonus for big dip
          if ((signal.indicators as any)?.dip_percentage && (signal.indicators as any).dip_percentage > 7) {
            score += 10
          }
        } else if (signal.action === 'hold') {
          score += 20 // Neutral
        }
        
        // Factor 2: Historical performance (30 points)
        if (historicalWinners.has(ticker)) {
          score += 30
        }
        
        // Factor 3: RSI in tradeable range (20 points)
        if (signal.indicators?.rsi) {
          const rsi = signal.indicators.rsi
          if (rsi >= 25 && rsi <= 75) {
            score += 20
          } else if (rsi < 25 || rsi > 75) {
            score += 10 // Extreme values can be good
          }
        }
        
        // Factor 4: Volatility/opportunity (10 points)
        if ((signal.indicators as any)?.dip_percentage && Math.abs((signal.indicators as any).dip_percentage) > 3) {
          score += 10
        }
        
        recommendations.push({
          ticker,
          score,
          signal: signal.action,
          reason: signal.reason,
          rsi: signal.indicators?.rsi,
          currentPrice: signal.indicators?.current_price,
          dipPercentage: (signal.indicators as any)?.dip_percentage,
          historicalWinner: historicalWinners.has(ticker),
          recommendation: score >= 60 ? 'Strong Buy' : score >= 40 ? 'Consider' : 'Watch'
        })
        
      } catch (error) {
        console.error(`Error analyzing ${ticker}:`, error)
        // Skip this ticker
      }
    }
    
    // Sort by score and return top N
    const topRecommendations = recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
    
    return NextResponse.json({
      recommendations: topRecommendations,
      analyzed: TICKER_UNIVERSE.length,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error generating recommendations:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}

