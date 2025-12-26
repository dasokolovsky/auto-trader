/**
 * Backtesting System
 * Simulates trading strategy on historical data to pre-train the intelligent system
 */

import { getServiceSupabase } from './supabase'
import { EnhancedTradingStrategy } from './enhanced-strategy'

interface BacktestResult {
  ticker: string
  totalTrades: number
  wins: number
  losses: number
  winRate: number
  totalProfit: number
  avgProfit: number
  score: number
  trades: Array<{
    date: string
    side: 'buy' | 'sell'
    price: number
    quantity: number
    profit?: number
  }>
}

export class Backtester {
  private supabase = getServiceSupabase()
  private strategy: EnhancedTradingStrategy
  private params: any

  constructor(strategyParams?: any) {
    // Use more relaxed parameters for backtesting to generate more signals
    this.params = strategyParams || {
      rsi_oversold: 45,        // Relaxed from 30 to catch more opportunities
      rsi_overbought: 70,
      dip_percentage: 2,       // Relaxed from 5% to 2% for more signals
      profit_target_percent: 8,
      stop_loss_percent: 3,
      position_size_usd: 1000,
      max_positions: 5,
      lookback_days: 20        // Look back 20 days for dip calculation
    }
    this.strategy = new EnhancedTradingStrategy(this.params)
  }
  
  /**
   * Fetch historical price data from Yahoo Finance
   */
  async fetchHistoricalData(ticker: string, days: number = 90): Promise<any[]> {
    try {
      // Import and instantiate Yahoo Finance
      const YahooFinance = (await import('yahoo-finance2')).default
      const yahooFinance = new YahooFinance()

      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const queryOptions = {
        period1: startDate,
        period2: endDate,
        interval: '1d' as const
      }

      // Use the chart method to get historical data
      const result = await yahooFinance.chart(ticker, queryOptions)

      if (!result || !result.quotes || result.quotes.length === 0) {
        console.log(`No data returned for ${ticker}`)
        return []
      }

      const data = result.quotes.map((bar: any) => ({
        timestamp: bar.date,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: bar.volume
      })).filter((bar: any) => bar.close !== null && bar.close !== undefined)

      console.log(`Fetched ${data.length} bars for ${ticker}`)
      return data
    } catch (error) {
      console.error(`Failed to fetch data for ${ticker}:`, error)
      return []
    }
  }
  
  /**
   * Run backtest on a single ticker
   */
  async backtestTicker(ticker: string, days: number = 90): Promise<BacktestResult> {
    console.log(`Backtesting ${ticker}...`)
    
    const historicalData = await this.fetchHistoricalData(ticker, days)
    
    if (historicalData.length === 0) {
      return {
        ticker,
        totalTrades: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        totalProfit: 0,
        avgProfit: 0,
        score: 0,
        trades: []
      }
    }
    
    const trades: any[] = []
    let position: any = null
    
    // Simulate trading day by day
    for (let i = 20; i < historicalData.length; i++) {
      const currentBar = historicalData[i]
      const historicalBars = historicalData.slice(Math.max(0, i - 100), i + 1)

      // Generate signal with current position and historical bars
      const signal = await this.strategy.generateSignal(ticker, position, historicalBars)

      if (!signal) continue

      // Execute simulated trade
      if (signal.action === 'buy' && !position) {
        const qty = Math.floor(this.params.position_size_usd / currentBar.close)
        
        if (qty > 0) {
          position = {
            ticker,
            buyPrice: currentBar.close,
            quantity: qty,
            buyDate: currentBar.timestamp
          }
          
          trades.push({
            date: currentBar.timestamp,
            side: 'buy',
            price: currentBar.close,
            quantity: qty
          })
        }
      } else if (signal.action === 'sell' && position) {
        const profit = (currentBar.close - position.buyPrice) * position.quantity
        
        trades.push({
          date: currentBar.timestamp,
          side: 'sell',
          price: currentBar.close,
          quantity: position.quantity,
          profit
        })
        
        position = null
      }
    }
    
    // Calculate results
    const buyTrades = trades.filter(t => t.side === 'buy')
    const sellTrades = trades.filter(t => t.side === 'sell')

    let wins = 0
    let losses = 0
    let totalProfit = 0

    sellTrades.forEach(sell => {
      if (sell.profit > 0) wins++
      else losses++
      totalProfit += sell.profit
    })

    const completedTrades = wins + losses
    const winRate = completedTrades > 0 ? (wins / completedTrades) * 100 : 0
    const avgProfit = completedTrades > 0 ? totalProfit / completedTrades : 0
    
    // Calculate score (same as IntelligentTrader)
    const winRateScore = winRate * 0.5
    const profitScore = Math.min(Math.max(avgProfit / 10, -10), 10) * 3
    const volumeScore = Math.min(completedTrades / 10, 1) * 20
    const score = Math.max(0, Math.min(100, winRateScore + profitScore + volumeScore))
    
    return {
      ticker,
      totalTrades: trades.length,
      wins,
      losses,
      winRate,
      totalProfit,
      avgProfit,
      score,
      trades
    }
  }
  
  /**
   * Save backtest results to database as simulated trades
   */
  async saveBacktestResults(result: BacktestResult): Promise<void> {
    console.log(`Saving backtest results for ${result.ticker}...`)
    
    for (const trade of result.trades) {
      await this.supabase.from('trades').insert({
        ticker: result.ticker,
        side: trade.side,
        quantity: trade.quantity.toString(),
        price: trade.price.toString(),
        executed_at: trade.date,
        is_simulated: true, // Mark as backtest data
        profit: trade.profit || null
      })
    }
    
    console.log(`✓ Saved ${result.trades.length} trades for ${result.ticker}`)
  }
}

