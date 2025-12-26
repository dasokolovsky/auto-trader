/**
 * Autonomous Stock Screener
 * Automatically discovers and scores tradable stocks
 */

import { alpacaClient } from './alpaca'

interface StockCandidate {
  symbol: string
  name: string
  price: number
  volume: number
  marketCap?: number
  score: number
  momentum: number
  volatility: number
  volumeScore: number
  trend: number
  reason: string
}

interface ScreenerCriteria {
  minPrice: number
  maxPrice: number
  minVolume: number
  minMarketCap?: number
  maxCandidates: number
}

export class StockScreener {
  private readonly defaultCriteria: ScreenerCriteria = {
    minPrice: 5,
    maxPrice: 500,
    minVolume: 500000,
    minMarketCap: 1000000000, // $1B
    maxCandidates: 50
  }

  /**
   * Get all tradable stocks from Alpaca
   */
  async getAllTradableStocks(): Promise<string[]> {
    try {
      // Alpaca's client doesn't expose listAssets directly in the typed interface
      // We'll need to access the underlying client
      const assets = await (alpacaClient as any).client.getAssets({
        status: 'active',
        asset_class: 'us_equity'
      })

      // Filter for tradable stocks on major exchanges
      const tradableSymbols = assets
        .filter((asset: any) => 
          asset.tradable && 
          asset.status === 'active' &&
          (asset.exchange === 'NASDAQ' || asset.exchange === 'NYSE' || asset.exchange === 'ARCA')
        )
        .map((asset: any) => asset.symbol)

      console.log(`Found ${tradableSymbols.length} tradable stocks from Alpaca`)
      return tradableSymbols
    } catch (error) {
      console.error('Error fetching tradable stocks from Alpaca:', error)
      return []
    }
  }

  /**
   * Get pre-screened stocks from Yahoo Finance
   */
  async getYahooScreenedStocks(): Promise<string[]> {
    try {
      const YahooFinance = (await import('yahoo-finance2')).default
      const yahooFinance = new YahooFinance()

      const screeners = [
        'day_gainers',
        'most_actives',
        'growth_technology_stocks',
        'undervalued_growth_stocks'
      ]

      const allSymbols = new Set<string>()

      for (const screener of screeners) {
        try {
          const result = await yahooFinance.screener(screener as any, { count: 25 })
          
          if (result && result.quotes) {
            result.quotes.forEach((quote: any) => {
              if (quote.symbol) {
                allSymbols.add(quote.symbol)
              }
            })
          }
        } catch (error) {
          console.error(`Error with screener ${screener}:`, error)
        }
      }

      console.log(`Found ${allSymbols.size} stocks from Yahoo screeners`)
      return Array.from(allSymbols)
    } catch (error) {
      console.error('Error fetching Yahoo screened stocks:', error)
      return []
    }
  }

  /**
   * Score a stock based on multiple factors
   */
  async scoreStock(symbol: string): Promise<StockCandidate | null> {
    try {
      const YahooFinance = (await import('yahoo-finance2')).default
      const yahooFinance = new YahooFinance()

      // Get quote for current price and volume
      const quote = await yahooFinance.quote(symbol)
      
      if (!quote || !quote.regularMarketPrice) {
        return null
      }

      const price = quote.regularMarketPrice
      const volume = quote.regularMarketVolume || 0
      const marketCap = quote.marketCap

      // Get historical data for technical analysis
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 250) // ~1 year for SMA 200

      const chart = await yahooFinance.chart(symbol, {
        period1: startDate,
        period2: endDate,
        interval: '1d'
      })

      if (!chart || !chart.quotes || chart.quotes.length < 50) {
        return null
      }

      const quotes = chart.quotes
      const closePrices = quotes.map((q: any) => q.close).filter((p: number) => p > 0)
      
      if (closePrices.length < 50) {
        return null
      }

      // Calculate scores (0-100 each)
      const momentum = this.calculateMomentumScore(closePrices)
      const volatilityScore = this.calculateVolatilityScore(quotes)
      const volumeScore = this.calculateVolumeScore(quotes)
      const trend = this.calculateTrendScore(closePrices)

      // Weighted total score
      const score = (
        momentum * 0.30 +
        volatilityScore * 0.20 +
        volumeScore * 0.20 +
        trend * 0.30
      )

      return {
        symbol,
        name: quote.shortName || quote.longName || symbol,
        price,
        volume,
        marketCap,
        score: Math.round(score),
        momentum: Math.round(momentum),
        volatility: Math.round(volatilityScore),
        volumeScore: Math.round(volumeScore),
        trend: Math.round(trend),
        reason: this.generateReason(score, momentum, trend)
      }
    } catch (error) {
      console.error(`Error scoring ${symbol}:`, error)
      return null
    }
  }

  /**
   * Calculate momentum score (price vs SMA 50/200)
   */
  private calculateMomentumScore(prices: number[]): number {
    if (prices.length < 200) return 50 // Neutral if not enough data

    const currentPrice = prices[prices.length - 1]
    const sma50 = this.calculateSMA(prices, 50)
    const sma200 = this.calculateSMA(prices, 200)

    let score = 50 // Start neutral

    // Above both SMAs = bullish
    if (currentPrice > sma50 && currentPrice > sma200) {
      score += 30
    }

    // SMA 50 above SMA 200 = golden cross
    if (sma50 > sma200) {
      score += 20
    }

    // Recent momentum (last 20 days)
    const recentPrices = prices.slice(-20)
    const recentChange = ((currentPrice - recentPrices[0]) / recentPrices[0]) * 100

    if (recentChange > 5) score += 10
    else if (recentChange < -5) score -= 10

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Calculate volatility score (ATR relative to price)
   */
  private calculateVolatilityScore(quotes: any[]): number {
    if (quotes.length < 20) return 50

    const atr = this.calculateATR(quotes, 14)
    const currentPrice = quotes[quotes.length - 1].close
    const atrPercent = (atr / currentPrice) * 100

    // Sweet spot: 2-5% ATR (enough movement, not too volatile)
    if (atrPercent >= 2 && atrPercent <= 5) return 100
    if (atrPercent >= 1.5 && atrPercent <= 6) return 75
    if (atrPercent >= 1 && atrPercent <= 7) return 50
    return 25
  }

  /**
   * Calculate volume score (recent volume vs average)
   */
  private calculateVolumeScore(quotes: any[]): number {
    if (quotes.length < 20) return 50

    const recentVolumes = quotes.slice(-5).map((q: any) => q.volume)
    const avgRecentVolume = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length

    const historicalVolumes = quotes.slice(-20, -5).map((q: any) => q.volume)
    const avgHistoricalVolume = historicalVolumes.reduce((a, b) => a + b, 0) / historicalVolumes.length

    const volumeRatio = avgRecentVolume / avgHistoricalVolume

    // Higher recent volume = more interest
    if (volumeRatio >= 1.5) return 100
    if (volumeRatio >= 1.2) return 75
    if (volumeRatio >= 0.8) return 50
    return 25
  }

  /**
   * Calculate trend score (consistent uptrend)
   */
  private calculateTrendScore(prices: number[]): number {
    if (prices.length < 50) return 50

    const recent50 = prices.slice(-50)
    let upDays = 0
    let downDays = 0

    for (let i = 1; i < recent50.length; i++) {
      if (recent50[i] > recent50[i - 1]) upDays++
      else downDays++
    }

    const upRatio = upDays / (upDays + downDays)

    // Strong uptrend
    if (upRatio >= 0.6) return 100
    if (upRatio >= 0.55) return 75
    if (upRatio >= 0.45) return 50
    return 25
  }

  /**
   * Helper: Calculate Simple Moving Average
   */
  private calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return 0
    const slice = prices.slice(-period)
    return slice.reduce((a, b) => a + b, 0) / period
  }

  /**
   * Helper: Calculate ATR
   */
  private calculateATR(quotes: any[], period: number): number {
    if (quotes.length < period + 1) return 0

    const trueRanges: number[] = []

    for (let i = 1; i < quotes.length; i++) {
      const high = quotes[i].high
      const low = quotes[i].low
      const prevClose = quotes[i - 1].close

      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      )
      trueRanges.push(tr)
    }

    let atr = trueRanges.slice(0, period).reduce((sum, tr) => sum + tr, 0) / period

    for (let i = period; i < trueRanges.length; i++) {
      atr = (atr * (period - 1) + trueRanges[i]) / period
    }

    return atr
  }

  /**
   * Generate reason for score
   */
  private generateReason(score: number, momentum: number, trend: number): string {
    if (score >= 70) {
      return `Strong candidate (Momentum: ${momentum}, Trend: ${trend})`
    } else if (score >= 50) {
      return `Moderate candidate (Momentum: ${momentum}, Trend: ${trend})`
    } else {
      return `Weak candidate (Momentum: ${momentum}, Trend: ${trend})`
    }
  }

  /**
   * Screen and rank all stocks
   */
  async screenStocks(criteria: Partial<ScreenerCriteria> = {}): Promise<StockCandidate[]> {
    const config = { ...this.defaultCriteria, ...criteria }

    console.log('🔍 Starting stock screening...')

    // Get stocks from Yahoo screeners (faster and pre-filtered)
    const yahooStocks = await this.getYahooScreenedStocks()

    console.log(`📊 Total unique symbols to analyze: ${yahooStocks.length}`)

    // Score each stock (in batches to avoid rate limits)
    const candidates: StockCandidate[] = []

    for (let i = 0; i < yahooStocks.length; i += 10) {
      const batch = yahooStocks.slice(i, i + 10)
      const results = await Promise.all(
        batch.map(symbol => this.scoreStock(symbol))
      )

      results.forEach(candidate => {
        if (candidate &&
            candidate.price >= config.minPrice &&
            candidate.price <= config.maxPrice &&
            candidate.volume >= config.minVolume &&
            (!config.minMarketCap || !candidate.marketCap || candidate.marketCap >= config.minMarketCap)) {
          candidates.push(candidate)
        }
      })

      console.log(`Processed ${Math.min(i + 10, yahooStocks.length)}/${yahooStocks.length} symbols...`)

      // Rate limiting: wait 1 second between batches
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score)

    // Return top candidates
    const topCandidates = candidates.slice(0, config.maxCandidates)
    console.log(`✅ Found ${topCandidates.length} top candidates`)

    return topCandidates
  }
}
