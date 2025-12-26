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

export class TradingStrategy {
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

    // Initial average gain/loss
    for (let i = 0; i < period; i++) {
      if (changes[i] > 0) {
        gains += changes[i]
      } else {
        losses += Math.abs(changes[i])
      }
    }

    let avgGain = gains / period
    let avgLoss = losses / period

    // Calculate subsequent values using smoothing
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

  // Calculate percentage change from high
  private calculateDipFromHigh(prices: number[], lookbackDays: number): number {
    const recentPrices = prices.slice(-lookbackDays)
    const high = Math.max(...recentPrices)
    const current = prices[prices.length - 1]
    return ((current - high) / high) * 100
  }

  // Generate buy/sell signal for a ticker
  async generateSignal(ticker: string, currentPosition: any = null, historicalBars: any[] = []): Promise<TradingSignal> {
    try {
      // Use provided historical bars (for backtesting) or fetch from Alpaca
      let bars: any[]

      if (historicalBars && historicalBars.length > 0) {
        // Use provided bars for backtesting
        bars = historicalBars
      } else {
        // Fetch from Alpaca for live trading
        bars = await alpacaClient.getBars(ticker, '1Day', 100)
      }

      if (!bars || bars.length < 30) {
        return {
          ticker,
          action: 'hold',
          reason: 'Insufficient data',
          indicators: {},
        }
      }

      // Handle both Alpaca format (c, o, h, l) and backtest format (close, open, high, low)
      const closePrices = bars.map((bar: any) => bar.c || bar.close)
      const currentPrice = closePrices[closePrices.length - 1]

      // Calculate indicators
      const rsi = this.calculateRSI(closePrices)
      const dipPercent = this.calculateDipFromHigh(closePrices, this.config.lookback_days)

      // BUY LOGIC
      if (!currentPosition) {
        const isOversold = rsi < this.config.rsi_oversold
        const isDip = dipPercent <= -this.config.dip_percentage

        if (isOversold && isDip) {
          return {
            ticker,
            action: 'buy',
            reason: `RSI oversold (${rsi.toFixed(2)}) and ${Math.abs(dipPercent).toFixed(2)}% dip detected`,
            indicators: {
              rsi,
              price_change_percent: dipPercent,
              current_price: currentPrice,
            },
          }
        }

        return {
          ticker,
          action: 'hold',
          reason: `Waiting for buy signal (RSI: ${rsi.toFixed(2)}, Dip: ${dipPercent.toFixed(2)}%)`,
          indicators: {
            rsi,
            price_change_percent: dipPercent,
            current_price: currentPrice,
          },
        }
      }

      // SELL LOGIC (if we have a position)
      const entryPrice = parseFloat(currentPosition.avg_entry_price)
      const profitPercent = ((currentPrice - entryPrice) / entryPrice) * 100

      // Check sell conditions
      const isOverbought = rsi > this.config.rsi_overbought
      const hitProfitTarget = profitPercent >= this.config.profit_target_percent
      const hitStopLoss = profitPercent <= -this.config.stop_loss_percent

      if (isOverbought) {
        return {
          ticker,
          action: 'sell',
          reason: `RSI overbought (${rsi.toFixed(2)}) - Profit: ${profitPercent.toFixed(2)}%`,
          indicators: {
            rsi,
            price_change_percent: profitPercent,
            current_price: currentPrice,
          },
        }
      }

      if (hitProfitTarget) {
        return {
          ticker,
          action: 'sell',
          reason: `Profit target reached: ${profitPercent.toFixed(2)}%`,
          indicators: {
            rsi,
            price_change_percent: profitPercent,
            current_price: currentPrice,
          },
        }
      }

      if (hitStopLoss) {
        return {
          ticker,
          action: 'sell',
          reason: `Stop loss triggered: ${profitPercent.toFixed(2)}%`,
          indicators: {
            rsi,
            price_change_percent: profitPercent,
            current_price: currentPrice,
          },
        }
      }

      return {
        ticker,
        action: 'hold',
        reason: `Holding position (P/L: ${profitPercent.toFixed(2)}%, RSI: ${rsi.toFixed(2)})`,
        indicators: {
          rsi,
          price_change_percent: profitPercent,
          current_price: currentPrice,
        },
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

