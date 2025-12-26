import { NextResponse } from 'next/server'
import { IntelligentTrader } from '@/lib/intelligent-trader'

/**
 * Manually trigger intelligent watchlist cleanup
 * Removes poor-performing tickers
 */
export async function POST(request: Request) {
  try {
    const intelligentTrader = new IntelligentTrader()
    
    const { removed, reasons } = await intelligentTrader.autoCleanupWatchlist()
    
    return NextResponse.json({
      message: removed.length > 0 
        ? `Removed ${removed.length} poor-performing tickers` 
        : 'No tickers needed removal',
      removed,
      reasons,
      count: removed.length
    })
    
  } catch (error) {
    console.error('Error during cleanup:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup watchlist' },
      { status: 500 }
    )
  }
}

/**
 * Get cleanup recommendations without executing
 */
export async function GET(request: Request) {
  try {
    const intelligentTrader = new IntelligentTrader()
    const { getServiceSupabase } = await import('@/lib/supabase')
    const supabase = getServiceSupabase()
    
    const { data: watchlist } = await supabase
      .from('watchlist')
      .select('*')
      .eq('is_active', true)
    
    if (!watchlist) {
      return NextResponse.json({ recommendations: [] })
    }
    
    const recommendations = []
    
    for (const item of watchlist) {
      const performance = await intelligentTrader.analyzeTickerPerformance(item.ticker)
      const { shouldRemove, reason } = await intelligentTrader.shouldRemoveFromWatchlist(item.ticker)
      
      recommendations.push({
        ticker: item.ticker,
        shouldRemove,
        reason,
        performance: {
          score: performance.score,
          winRate: performance.winRate,
          totalProfit: performance.totalProfit,
          recentTrades: performance.recentTrades,
          status: performance.status
        }
      })
    }
    
    // Sort by score (worst first)
    recommendations.sort((a, b) => a.performance.score - b.performance.score)
    
    return NextResponse.json({
      recommendations,
      toRemove: recommendations.filter(r => r.shouldRemove).length,
      total: recommendations.length
    })
    
  } catch (error) {
    console.error('Error getting recommendations:', error)
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    )
  }
}

