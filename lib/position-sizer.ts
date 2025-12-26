/**
 * Intelligent Position Sizing
 * Allocates capital based on stock performance and risk
 */

import { IntelligentTrader } from './intelligent-trader'
import { alpacaClient } from './alpaca'

interface PositionSizeConfig {
  basePositionSize: number // Base position size in USD
  maxPositionSize: number // Max position size in USD
  minPositionSize: number // Min position size in USD
  maxPortfolioPercent: number // Max % of portfolio per position
  maxPositions: number // Max concurrent positions
}

export class PositionSizer {
  private intelligentTrader = new IntelligentTrader()

  private readonly config: PositionSizeConfig = {
    basePositionSize: 1000,
    maxPositionSize: 5000,
    minPositionSize: 500,
    maxPortfolioPercent: 0.10, // 10% max per position
    maxPositions: 10
  }

  /**
   * Calculate position size based on stock score and portfolio value
   */
  async calculatePositionSize(
    ticker: string,
    currentPrice: number,
    portfolioValue?: number
  ): Promise<{ shares: number; dollarAmount: number; reason: string }> {
    
    // Get portfolio value if not provided
    if (!portfolioValue) {
      const account = await alpacaClient.getAccount()
      portfolioValue = parseFloat(account.portfolio_value)
    }

    // Analyze ticker performance
    const performance = await this.intelligentTrader.analyzeTickerPerformance(ticker)

    // Calculate position size based on score
    let positionSize = this.config.basePositionSize

    if (performance.status === 'excellent') {
      // Excellent performers get max allocation
      positionSize = this.config.maxPositionSize
    } else if (performance.status === 'good') {
      // Good performers get above-average allocation
      positionSize = this.config.basePositionSize * 1.5
    } else if (performance.status === 'unproven') {
      // Unproven stocks get minimum allocation
      positionSize = this.config.minPositionSize
    } else {
      // Poor performers shouldn't be bought (but just in case)
      positionSize = this.config.minPositionSize
    }

    // Apply portfolio percentage limit
    const maxByPortfolio = portfolioValue * this.config.maxPortfolioPercent
    positionSize = Math.min(positionSize, maxByPortfolio)

    // Ensure within min/max bounds
    positionSize = Math.max(this.config.minPositionSize, Math.min(this.config.maxPositionSize, positionSize))

    // Calculate shares
    const shares = Math.floor(positionSize / currentPrice)
    const actualDollarAmount = shares * currentPrice

    // Generate reason
    const reason = this.generateReason(performance, positionSize, actualDollarAmount)

    return {
      shares,
      dollarAmount: actualDollarAmount,
      reason
    }
  }

  /**
   * Calculate position size using Kelly Criterion (optional, more aggressive)
   */
  async calculateKellyPosition(
    ticker: string,
    currentPrice: number,
    portfolioValue?: number,
    kellyFraction: number = 0.25 // Use 25% of Kelly (conservative)
  ): Promise<{ shares: number; dollarAmount: number; reason: string }> {
    
    if (!portfolioValue) {
      const account = await alpacaClient.getAccount()
      portfolioValue = parseFloat(account.portfolio_value)
    }

    const performance = await this.intelligentTrader.analyzeTickerPerformance(ticker)

    // Kelly Criterion: f = (bp - q) / b
    // where:
    // f = fraction of capital to wager
    // b = odds received on the wager (avg win / avg loss)
    // p = probability of winning (win rate)
    // q = probability of losing (1 - p)

    if (performance.recentTrades < 3) {
      // Not enough data for Kelly, use conservative sizing
      return this.calculatePositionSize(ticker, currentPrice, portfolioValue)
    }

    const winRate = performance.winRate / 100 // Convert to decimal
    const lossRate = 1 - winRate

    // Calculate average win/loss ratio
    const avgWin = performance.wins > 0 ? performance.totalProfit / performance.wins : 0
    const avgLoss = performance.losses > 0 ? Math.abs(performance.totalProfit) / performance.losses : 1

    const b = avgLoss > 0 ? avgWin / avgLoss : 1

    // Kelly formula
    let kellyPercent = (b * winRate - lossRate) / b

    // Apply Kelly fraction (conservative)
    kellyPercent = kellyPercent * kellyFraction

    // Ensure positive and within bounds
    kellyPercent = Math.max(0, Math.min(this.config.maxPortfolioPercent, kellyPercent))

    // Calculate position size
    let positionSize = portfolioValue * kellyPercent

    // Ensure within min/max bounds
    positionSize = Math.max(this.config.minPositionSize, Math.min(this.config.maxPositionSize, positionSize))

    const shares = Math.floor(positionSize / currentPrice)
    const actualDollarAmount = shares * currentPrice

    const reason = `Kelly Criterion (${(kellyPercent * 100).toFixed(1)}% of portfolio, ${kellyFraction * 100}% Kelly fraction)`

    return {
      shares,
      dollarAmount: actualDollarAmount,
      reason
    }
  }

  /**
   * Generate reason for position size
   */
  private generateReason(performance: any, positionSize: number, actualAmount: number): string {
    const status = performance.status
    const score = performance.score

    if (status === 'excellent') {
      return `Max allocation ($${actualAmount.toFixed(0)}) - Excellent performer (Score: ${score.toFixed(0)}, Win Rate: ${performance.winRate.toFixed(1)}%)`
    } else if (status === 'good') {
      return `Above-average allocation ($${actualAmount.toFixed(0)}) - Good performer (Score: ${score.toFixed(0)})`
    } else if (status === 'unproven') {
      return `Conservative allocation ($${actualAmount.toFixed(0)}) - Unproven stock (${performance.recentTrades} trades)`
    } else {
      return `Minimum allocation ($${actualAmount.toFixed(0)}) - Poor performer (Score: ${score.toFixed(0)})`
    }
  }
}

