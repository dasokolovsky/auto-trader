/**
 * Intelligent Trading System
 * Makes smart decisions about what to buy, sell, and keep in watchlist
 */

import { getServiceSupabase } from './supabase'

interface TickerPerformance {
  ticker: string
  totalTrades: number
  wins: number
  losses: number
  winRate: number
  totalProfit: number
  avgProfit: number
  recentTrades: number
  score: number
  status: 'excellent' | 'good' | 'poor' | 'unproven'
}

export class IntelligentTrader {
  private supabase = getServiceSupabase()
  
  // Thresholds for decision making
  private readonly MIN_TRADES_FOR_EVALUATION = 3 // Need at least 3 trades to judge
  private readonly EXCELLENT_SCORE = 70
  private readonly POOR_SCORE = 30
  private readonly REMOVE_SCORE = 20 // Auto-remove if score drops below this
  
  /**
   * Analyze a ticker's historical performance
   * Includes both real trades and simulated (backtest) trades
   */
  async analyzeTickerPerformance(ticker: string, lookbackDays: number = 30): Promise<TickerPerformance> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - lookbackDays)

    // Get all trades for this ticker (both real and simulated)
    // This allows the system to learn from backtested data
    const { data: trades } = await this.supabase
      .from('trades')
      .select('*')
      .eq('ticker', ticker)
      .gte('executed_at', startDate.toISOString())
      .order('executed_at', { ascending: true })
    
    if (!trades || trades.length === 0) {
      return {
        ticker,
        totalTrades: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        totalProfit: 0,
        avgProfit: 0,
        recentTrades: 0,
        score: 50, // Neutral score for unproven tickers
        status: 'unproven'
      }
    }
    
    // Match buy/sell pairs
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
    
    // Calculate score (0-100)
    const winRateScore = winRate * 0.5 // 50% weight
    const profitScore = Math.min(Math.max(avgProfit / 10, -10), 10) * 3 // 30% weight, scaled
    const volumeScore = Math.min(completedTrades / 10, 1) * 20 // 20% weight
    
    const score = Math.max(0, Math.min(100, winRateScore + profitScore + volumeScore))
    
    // Determine status
    let status: 'excellent' | 'good' | 'poor' | 'unproven'
    if (completedTrades < this.MIN_TRADES_FOR_EVALUATION) {
      status = 'unproven'
    } else if (score >= this.EXCELLENT_SCORE) {
      status = 'excellent'
    } else if (score >= this.POOR_SCORE) {
      status = 'good'
    } else {
      status = 'poor'
    }
    
    return {
      ticker,
      totalTrades: trades.length,
      wins,
      losses,
      winRate,
      totalProfit,
      avgProfit,
      recentTrades: completedTrades,
      score,
      status
    }
  }
  
  /**
   * Decide if we should buy this ticker
   * Returns: { shouldBuy: boolean, reason: string }
   */
  async shouldBuyTicker(ticker: string, signalAction: string): Promise<{ shouldBuy: boolean; reason: string }> {
    // If signal is not 'buy', don't buy
    if (signalAction !== 'buy') {
      return { shouldBuy: false, reason: 'No buy signal from strategy' }
    }
    
    // Analyze historical performance
    const performance = await this.analyzeTickerPerformance(ticker)
    
    // Decision logic
    if (performance.status === 'unproven') {
      // New ticker or not enough data - give it a chance
      return { shouldBuy: true, reason: 'Unproven ticker - testing it out' }
    }
    
    if (performance.status === 'excellent') {
      // Great performer - definitely buy
      return { shouldBuy: true, reason: `Excellent performer (Score: ${performance.score.toFixed(0)}, Win Rate: ${performance.winRate.toFixed(1)}%)` }
    }
    
    if (performance.status === 'good') {
      // Decent performer - buy
      return { shouldBuy: true, reason: `Good performer (Score: ${performance.score.toFixed(0)})` }
    }
    
    // Poor performer - don't buy
    return { 
      shouldBuy: false, 
      reason: `Poor performer (Score: ${performance.score.toFixed(0)}, Win Rate: ${performance.winRate.toFixed(1)}%) - skipping` 
    }
  }
  
  /**
   * Decide if we should remove this ticker from watchlist
   */
  async shouldRemoveFromWatchlist(ticker: string): Promise<{ shouldRemove: boolean; reason: string }> {
    const performance = await this.analyzeTickerPerformance(ticker)
    
    // Don't remove if not enough data
    if (performance.status === 'unproven') {
      return { shouldRemove: false, reason: 'Not enough data yet' }
    }
    
    // Remove if score is critically low
    if (performance.score < this.REMOVE_SCORE) {
      return { 
        shouldRemove: true, 
        reason: `Critically poor performance (Score: ${performance.score.toFixed(0)}, Win Rate: ${performance.winRate.toFixed(1)}%, Total P/L: $${performance.totalProfit.toFixed(2)})` 
      }
    }
    
    // Remove if consistent loser
    if (performance.recentTrades >= 5 && performance.winRate < 25) {
      return { 
        shouldRemove: true, 
        reason: `Consistent loser (${performance.wins}W/${performance.losses}L, Win Rate: ${performance.winRate.toFixed(1)}%)` 
      }
    }
    
    return { shouldRemove: false, reason: 'Performance acceptable' }
  }
  
  /**
   * Auto-cleanup watchlist - remove poor performers
   */
  async autoCleanupWatchlist(): Promise<{ removed: string[]; reasons: Record<string, string> }> {
    const { data: watchlist } = await this.supabase
      .from('watchlist')
      .select('*')
      .eq('is_active', true)
    
    if (!watchlist) return { removed: [], reasons: {} }
    
    const removed: string[] = []
    const reasons: Record<string, string> = {}
    
    for (const item of watchlist) {
      const { shouldRemove, reason } = await this.shouldRemoveFromWatchlist(item.ticker)
      
      if (shouldRemove) {
        // Deactivate from watchlist
        await this.supabase
          .from('watchlist')
          .update({ is_active: false })
          .eq('id', item.id)
        
        removed.push(item.ticker)
        reasons[item.ticker] = reason
        
        console.log(`🗑️  Removed ${item.ticker} from watchlist: ${reason}`)
      }
    }
    
    return { removed, reasons }
  }
}

