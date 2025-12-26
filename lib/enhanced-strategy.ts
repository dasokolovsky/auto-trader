import { alpacaClient } from './alpaca'
import { TradingSignal, StrategyConfig } from '@/types'

interface Bar {
  t: string
  o: number
  h: number
  l: number
  c: number
  v: number
}

interface EnhancedIndicators {
  rsi: number
  dipPercent: number
  currentPrice: number
  volume: number
  avgVolume: number
  volumeRatio: number
  sma200: number
  aboveSMA200: boolean
  atr: number
  atrStopLoss?: number
  atrProfitTarget?: number
}

export class EnhancedTradingStrategy {
  private config: StrategyConfig['params']

  constructor(config: StrategyConfig['params']) {
    this.config = config
  }

  // Calculate RSI (Relative Strength Index)
  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) {
      throw new Error('Not enough data to calculate RSI')
    }

    const changes = []
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1])
    }

    let gains = 0
    let losses = 0

    for (let i = 0; i < period; i++) {
      if (changes[i] > 0) {
        gains += changes[i]
      } else {
        losses += Math.abs(changes[i])
      }
    }

    let avgGain = gains / period
    let avgLoss = losses / period

    for (let i = period; i < changes.length; i++) {
      const change = changes[i]
      if (change > 0) {
        avgGain = (avgGain * (period - 1) + change) / period
        avgLoss = (avgLoss * (period - 1)) / period
      } else {
        avgGain = (avgGain * (period - 1)) / period
        avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period
      }
    }

    if (avgLoss === 0) return 100
    const rs = avgGain / avgLoss
    const rsi = 100 - 100 / (1 + rs)

    return rsi
  }

  // Calculate Simple Moving Average
  private calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) {
      throw new Error(`Not enough data to calculate SMA(${period})`)
    }
    const slice = prices.slice(-period)
    const sum = slice.reduce((acc, price) => acc + price, 0)
    return sum / period
  }

  // Calculate Average True Range (ATR) for volatility
  private calculateATR(bars: any[], period: number = 14): number {
    if (bars.length < period + 1) {
      throw new Error('Not enough data to calculate ATR')
    }

    const trueRanges: number[] = []
    
    for (let i = 1; i < bars.length; i++) {
      const high = bars[i].h || bars[i].high
      const low = bars[i].l || bars[i].low
      const prevClose = bars[i - 1].c || bars[i - 1].close
      
      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      )
      trueRanges.push(tr)
    }

    // Calculate initial ATR (simple average)
    let atr = trueRanges.slice(0, period).reduce((sum, tr) => sum + tr, 0) / period

    // Smooth using Wilder's method
    for (let i = period; i < trueRanges.length; i++) {
      atr = (atr * (period - 1) + trueRanges[i]) / period
    }

    return atr
  }

  // Calculate percentage change from high
  private calculateDipFromHigh(prices: number[], lookbackDays: number): number {
    const recentPrices = prices.slice(-lookbackDays)
    const high = Math.max(...recentPrices)
    const current = prices[prices.length - 1]
    return ((current - high) / high) * 100
  }

  // QUICK WIN #1: Volume Confirmation
  private checkVolumeConfirmation(volumes: number[], currentVolume: number, period: number = 20): { avgVolume: number; volumeRatio: number; isConfirmed: boolean } {
    if (volumes.length < period) {
      return { avgVolume: 0, volumeRatio: 0, isConfirmed: false }
    }
    
    const recentVolumes = volumes.slice(-period)
    const avgVolume = recentVolumes.reduce((sum, v) => sum + v, 0) / period
    const volumeRatio = currentVolume / avgVolume
    
    // Volume spike = 1.5x average or higher
    const isConfirmed = volumeRatio >= 1.5
    
    return { avgVolume, volumeRatio, isConfirmed }
  }

  // QUICK WIN #2: Trend Filter (SMA 200 or SMA 50 fallback)
  private checkTrendFilter(prices: number[]): { sma200: number; aboveSMA200: boolean } {
    if (prices.length < 50) {
      // Not enough data at all
      return { sma200: 0, aboveSMA200: true }  // Default to true if not enough data
    }

    // Use SMA 200 if we have enough data, otherwise use SMA 50
    const smaPeriod = prices.length >= 200 ? 200 : 50
    const sma = this.calculateSMA(prices, smaPeriod)
    const currentPrice = prices[prices.length - 1]
    const aboveSMA = currentPrice > sma

    return { sma200: sma, aboveSMA200: aboveSMA }
  }

  // Generate enhanced buy/sell signal
  async generateSignal(ticker: string, currentPosition: any = null, historicalBars: any[] = []): Promise<TradingSignal> {
    try {
      let bars: any[]

      if (historicalBars && historicalBars.length > 0) {
        bars = historicalBars
      } else {
        // Fetch more bars for SMA 200
        bars = await alpacaClient.getBars(ticker, '1Day', 250)
      }

      if (!bars || bars.length < 30) {
        return {
          ticker,
          action: 'hold',
          reason: 'Insufficient data',
          indicators: {},
        }
      }

      // Extract data
      const closePrices = bars.map((bar: any) => bar.c || bar.close)
      const volumes = bars.map((bar: any) => bar.v || bar.volume)
      const currentPrice = closePrices[closePrices.length - 1]
      const currentVolume = volumes[volumes.length - 1]

      // Calculate all indicators
      const rsi = this.calculateRSI(closePrices)
      const dipPercent = this.calculateDipFromHigh(closePrices, this.config.lookback_days)

      // QUICK WIN #3: ATR for dynamic stops
      const atr = this.calculateATR(bars)

      // QUICK WIN #1: Volume confirmation
      const volumeCheck = this.checkVolumeConfirmation(volumes, currentVolume)

      // QUICK WIN #2: Trend filter
      const trendCheck = this.checkTrendFilter(closePrices)

      const indicators: EnhancedIndicators = {
        rsi,
        dipPercent,
        currentPrice,
        volume: currentVolume,
        avgVolume: volumeCheck.avgVolume,
        volumeRatio: volumeCheck.volumeRatio,
        sma200: trendCheck.sma200,
        aboveSMA200: trendCheck.aboveSMA200,
        atr,
      }

      // BUY LOGIC with enhanced filters - CONFLUENCE SCORING
      if (!currentPosition) {
        const isOversold = rsi < this.config.rsi_oversold
        const isDip = dipPercent <= -this.config.dip_percentage

        // NEW: Volume confirmation
        const hasVolumeConfirmation = volumeCheck.isConfirmed

        // NEW: Trend filter
        const isInUptrend = trendCheck.aboveSMA200

        // CONFLUENCE SCORING: Need at least 3 out of 4 signals
        let score = 0
        let reasons: string[] = []

        if (isOversold) {
          score += 2  // RSI is most important (weight: 2)
          reasons.push(`RSI oversold (${rsi.toFixed(2)})`)
        }
        if (isDip) {
          score += 2  // Dip is also important (weight: 2)
          reasons.push(`${Math.abs(dipPercent).toFixed(2)}% dip`)
        }
        if (hasVolumeConfirmation) {
          score += 1  // Volume confirmation (weight: 1)
          reasons.push(`Volume spike (${volumeCheck.volumeRatio.toFixed(2)}x)`)
        }
        if (isInUptrend) {
          score += 1  // Trend filter (weight: 1)
          reasons.push(`Above SMA`)
        }

        // Need score >= 4 (e.g., RSI + Dip, or RSI + Dip + Volume, etc.)
        // This is more flexible than requiring ALL conditions
        if (score >= 4) {
          // Calculate ATR-based stops
          indicators.atrStopLoss = currentPrice - (2 * atr)
          indicators.atrProfitTarget = currentPrice + (3 * atr)

          const strength = score >= 6 ? 'STRONG BUY' : score >= 5 ? 'BUY' : 'MODERATE BUY'

          return {
            ticker,
            action: 'buy',
            reason: `${strength} (${score}/6): ${reasons.join(', ')}`,
            indicators,
          }
        }

        // Provide detailed feedback
        const failedChecks: string[] = []
        if (!isOversold) failedChecks.push(`RSI ${rsi.toFixed(2)} >= ${this.config.rsi_oversold}`)
        if (!isDip) failedChecks.push(`Dip ${dipPercent.toFixed(2)}% > -${this.config.dip_percentage}%`)
        if (!hasVolumeConfirmation) failedChecks.push(`Volume ${volumeCheck.volumeRatio.toFixed(2)}x < 1.5x`)
        if (!isInUptrend) failedChecks.push(`Below SMA`)

        return {
          ticker,
          action: 'hold',
          reason: `Score ${score}/6 (need ≥4). Passed: ${reasons.join(', ') || 'none'}. Missing: ${failedChecks.join('; ')}`,
          indicators,
        }
      }

      // SELL LOGIC with ATR-based stops
      const entryPrice = parseFloat(currentPosition.avg_entry_price)
      const profitPercent = ((currentPrice - entryPrice) / entryPrice) * 100

      // QUICK WIN #3: Use ATR-based stops instead of fixed percentages
      const atrStopLoss = entryPrice - (2 * atr)
      const atrProfitTarget = entryPrice + (3 * atr)

      const atrStopLossPercent = ((atrStopLoss - entryPrice) / entryPrice) * 100
      const atrProfitTargetPercent = ((atrProfitTarget - entryPrice) / entryPrice) * 100

      indicators.atrStopLoss = atrStopLoss
      indicators.atrProfitTarget = atrProfitTarget

      // Check sell conditions
      const isOverbought = rsi > this.config.rsi_overbought
      const hitAtrProfitTarget = currentPrice >= atrProfitTarget
      const hitAtrStopLoss = currentPrice <= atrStopLoss

      if (isOverbought) {
        return {
          ticker,
          action: 'sell',
          reason: `RSI overbought (${rsi.toFixed(2)}) - Profit: ${profitPercent.toFixed(2)}%`,
          indicators,
        }
      }

      if (hitAtrProfitTarget) {
        return {
          ticker,
          action: 'sell',
          reason: `ATR profit target reached: ${profitPercent.toFixed(2)}% (Target: ${atrProfitTargetPercent.toFixed(2)}%)`,
          indicators,
        }
      }

      if (hitAtrStopLoss) {
        return {
          ticker,
          action: 'sell',
          reason: `ATR stop loss triggered: ${profitPercent.toFixed(2)}% (Stop: ${atrStopLossPercent.toFixed(2)}%)`,
          indicators,
        }
      }

      return {
        ticker,
        action: 'hold',
        reason: `Holding position (P/L: ${profitPercent.toFixed(2)}%, RSI: ${rsi.toFixed(2)}, ATR Stop: ${atrStopLossPercent.toFixed(2)}%, ATR Target: ${atrProfitTargetPercent.toFixed(2)}%)`,
        indicators,
      }
    } catch (error) {
      console.error(`Error generating signal for ${ticker}:`, error)
      return {
        ticker,
        action: 'hold',
        reason: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        indicators: {},
      }
    }
  }
}


