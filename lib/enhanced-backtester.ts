/**
 * Enhanced Backtesting System with Advanced Metrics
 * QUICK WINS #4 & #5: Sharpe Ratio and Max Drawdown tracking
 */

import { getServiceSupabase } from './supabase'
import { EnhancedTradingStrategy } from './enhanced-strategy'

interface EnhancedBacktestResult {
  ticker: string
  totalTrades: number
  wins: number
  losses: number
  winRate: number
  totalProfit: number
  avgProfit: number
  
  // QUICK WIN #4: Sharpe Ratio
  sharpeRatio: number
  
  // QUICK WIN #5: Max Drawdown
  maxDrawdown: number
  maxDrawdownPercent: number
  
  // Additional advanced metrics
  profitFactor: number  // Gross profit / Gross loss
  expectancy: number    // Average $ per trade
  avgWin: number
  avgLoss: number
  largestWin: number
  largestLoss: number
  
  score: number
  trades: Array<{
    date: string
    side: 'buy' | 'sell'
    price: number
    quantity: number
    profit?: number
  }>
  equityCurve: Array<{
    date: string
    equity: number
    drawdown: number
  }>
}

export class EnhancedBacktester {
  private supabase = getServiceSupabase()
  private strategy: EnhancedTradingStrategy
  private params: any

  constructor(strategyParams?: any) {
    this.params = strategyParams || {
      rsi_oversold: 30,
      rsi_overbought: 70,
      dip_percentage: 5,
      profit_target_percent: 8,
      stop_loss_percent: 3,
      position_size_usd: 1000,
      max_positions: 5,
      lookback_days: 20
    }
    this.strategy = new EnhancedTradingStrategy(this.params)
  }
  
  /**
   * Fetch historical price data from Yahoo Finance
   */
  async fetchHistoricalData(ticker: string, days: number = 90): Promise<any[]> {
    try {
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
   * QUICK WIN #4: Calculate Sharpe Ratio
   */
  private calculateSharpeRatio(returns: number[], riskFreeRate: number = 0.02): number {
    if (returns.length === 0) return 0
    
    // Annualized risk-free rate to daily
    const dailyRiskFreeRate = riskFreeRate / 252
    
    // Calculate excess returns
    const excessReturns = returns.map(r => r - dailyRiskFreeRate)
    
    // Calculate mean and standard deviation
    const mean = excessReturns.reduce((sum, r) => sum + r, 0) / excessReturns.length
    const variance = excessReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / excessReturns.length
    const stdDev = Math.sqrt(variance)
    
    if (stdDev === 0) return 0
    
    // Annualize Sharpe ratio
    const sharpe = (mean / stdDev) * Math.sqrt(252)
    
    return sharpe
  }
  
  /**
   * QUICK WIN #5: Calculate Max Drawdown
   */
  private calculateMaxDrawdown(equityCurve: number[]): { maxDD: number; maxDDPercent: number } {
    if (equityCurve.length === 0) return { maxDD: 0, maxDDPercent: 0 }
    
    let peak = equityCurve[0]
    let maxDD = 0
    let maxDDPercent = 0
    
    for (const equity of equityCurve) {
      if (equity > peak) {
        peak = equity
      }
      
      const drawdown = peak - equity
      const drawdownPercent = (drawdown / peak) * 100
      
      if (drawdown > maxDD) {
        maxDD = drawdown
        maxDDPercent = drawdownPercent
      }
    }
    
    return { maxDD, maxDDPercent }
  }
  
  /**
   * Run enhanced backtest on a single ticker
   */
  async backtestTicker(ticker: string, days: number = 90): Promise<EnhancedBacktestResult> {
    console.log(`\n🔬 Enhanced Backtesting ${ticker}...`)
    
    const historicalData = await this.fetchHistoricalData(ticker, days)
    
    if (historicalData.length === 0) {
      return this.getEmptyResult(ticker)
    }
    
    const trades: any[] = []
    const equityCurve: Array<{ date: string; equity: number; drawdown: number }> = []
    let position: any = null
    let equity = 10000 // Starting capital
    let peak = equity
    
    // Simulate trading day by day
    for (let i = 250; i < historicalData.length; i++) {  // Start at 250 for SMA200
      const currentBar = historicalData[i]
      const historicalBars = historicalData.slice(Math.max(0, i - 250), i + 1)

      // Generate signal with enhanced strategy
      const signal = await this.strategy.generateSignal(ticker, position, historicalBars)

      if (!signal) continue

      // Execute simulated trade
      if (signal.action === 'buy' && !position) {
        const qty = Math.floor(this.params.position_size_usd / currentBar.close)
        
        if (qty > 0) {
          position = {
            ticker,
            avg_entry_price: currentBar.close.toString(),
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
        const profit = (currentBar.close - parseFloat(position.avg_entry_price)) * position.quantity
        equity += profit
        
        trades.push({
          date: currentBar.timestamp,
          side: 'sell',
          price: currentBar.close,
          quantity: position.quantity,
          profit
        })
        
        position = null
      }
      
      // Track equity curve
      if (equity > peak) peak = equity
      const drawdown = ((peak - equity) / peak) * 100
      
      equityCurve.push({
        date: currentBar.timestamp,
        equity,
        drawdown
      })
    }

    // Calculate comprehensive results
    const buyTrades = trades.filter(t => t.side === 'buy')
    const sellTrades = trades.filter(t => t.side === 'sell')

    let wins = 0
    let losses = 0
    let totalProfit = 0
    let grossProfit = 0
    let grossLoss = 0
    const winningTrades: number[] = []
    const losingTrades: number[] = []

    sellTrades.forEach(sell => {
      const profit = sell.profit || 0
      totalProfit += profit

      if (profit > 0) {
        wins++
        grossProfit += profit
        winningTrades.push(profit)
      } else {
        losses++
        grossLoss += Math.abs(profit)
        losingTrades.push(profit)
      }
    })

    const completedTrades = wins + losses
    const winRate = completedTrades > 0 ? (wins / completedTrades) * 100 : 0
    const avgProfit = completedTrades > 0 ? totalProfit / completedTrades : 0

    // Advanced metrics
    const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, p) => sum + p, 0) / winningTrades.length : 0
    const avgLoss = losingTrades.length > 0 ? losingTrades.reduce((sum, p) => sum + p, 0) / losingTrades.length : 0
    const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades) : 0
    const largestLoss = losingTrades.length > 0 ? Math.min(...losingTrades) : 0

    // Profit Factor = Gross Profit / Gross Loss
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 999 : 0)

    // Expectancy = (Win% × Avg Win) - (Loss% × Avg Loss)
    const expectancy = (winRate / 100) * avgWin + ((100 - winRate) / 100) * avgLoss

    // QUICK WIN #4: Calculate Sharpe Ratio
    const returns = sellTrades.map(sell => {
      const buyTrade = buyTrades.find(buy => buy.date < sell.date)
      if (!buyTrade) return 0
      return (sell.price - buyTrade.price) / buyTrade.price
    })
    const sharpeRatio = this.calculateSharpeRatio(returns)

    // QUICK WIN #5: Calculate Max Drawdown
    const equityValues = equityCurve.map(e => e.equity)
    const { maxDD, maxDDPercent } = this.calculateMaxDrawdown(equityValues)

    // Enhanced scoring algorithm
    // Factors: Win Rate (30%), Sharpe Ratio (30%), Profit Factor (20%), Trade Volume (20%)
    const winRateScore = winRate * 0.3
    const sharpeScore = Math.min(Math.max(sharpeRatio * 10, 0), 30)  // Cap at 30
    const profitFactorScore = Math.min(Math.max((profitFactor - 1) * 10, 0), 20)  // Cap at 20
    const volumeScore = Math.min(completedTrades / 10, 1) * 20  // Cap at 20
    const score = Math.max(0, Math.min(100, winRateScore + sharpeScore + profitFactorScore + volumeScore))

    console.log(`✅ Completed: ${completedTrades} trades, ${wins}W/${losses}L, Win Rate: ${winRate.toFixed(1)}%`)
    console.log(`   Sharpe: ${sharpeRatio.toFixed(2)}, Max DD: ${maxDDPercent.toFixed(2)}%, Profit Factor: ${profitFactor.toFixed(2)}`)
    console.log(`   Score: ${score.toFixed(0)}/100`)

    return {
      ticker,
      totalTrades: trades.length,
      wins,
      losses,
      winRate,
      totalProfit,
      avgProfit,
      sharpeRatio,
      maxDrawdown: maxDD,
      maxDrawdownPercent: maxDDPercent,
      profitFactor,
      expectancy,
      avgWin,
      avgLoss,
      largestWin,
      largestLoss,
      score,
      trades,
      equityCurve
    }
  }

  private getEmptyResult(ticker: string): EnhancedBacktestResult {
    return {
      ticker,
      totalTrades: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      totalProfit: 0,
      avgProfit: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      maxDrawdownPercent: 0,
      profitFactor: 0,
      expectancy: 0,
      avgWin: 0,
      avgLoss: 0,
      largestWin: 0,
      largestLoss: 0,
      score: 0,
      trades: [],
      equityCurve: []
    }
  }

  /**
   * Save enhanced backtest results to database
   */
  async saveBacktestResults(result: EnhancedBacktestResult): Promise<void> {
    console.log(`💾 Saving enhanced backtest results for ${result.ticker}...`)

    // Save to backtest_results table with enhanced metrics
    await this.supabase.from('backtest_results').insert({
      ticker: result.ticker,
      total_trades: result.totalTrades,
      wins: result.wins,
      losses: result.losses,
      win_rate: result.winRate,
      total_profit: result.totalProfit,
      avg_profit: result.avgProfit,
      sharpe_ratio: result.sharpeRatio,
      max_drawdown: result.maxDrawdownPercent,
      profit_factor: result.profitFactor,
      expectancy: result.expectancy,
      score: result.score,
      tested_at: new Date().toISOString()
    })

    console.log(`✓ Saved enhanced metrics for ${result.ticker}`)
  }
}


