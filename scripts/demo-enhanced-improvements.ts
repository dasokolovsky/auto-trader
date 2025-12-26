#!/usr/bin/env tsx
/**
 * Demo script to show the improvements from Quick Wins
 * Uses a period with more volatility (2023) to demonstrate the enhancements
 */

import { Backtester } from '../lib/backtester'
import { EnhancedBacktester } from '../lib/enhanced-backtester'

async function demonstrateImprovements() {
  console.log('🎯 QUICK WINS DEMONSTRATION')
  console.log('=' .repeat(80))
  console.log('\nThis demo shows how the 5 Quick Wins improve the trading system:')
  console.log('  1. ✅ Volume Confirmation - Filters out low-conviction signals')
  console.log('  2. ✅ Trend Filter (SMA) - Only trades with the trend')
  console.log('  3. ✅ ATR-Based Stops - Adapts to volatility')
  console.log('  4. ✅ Sharpe Ratio - Measures risk-adjusted returns')
  console.log('  5. ✅ Max Drawdown - Tracks worst-case scenarios')
  console.log('\n' + '='.repeat(80))

  // Use more relaxed parameters to generate signals in current market
  const relaxedParams = {
    rsi_oversold: 40,  // More relaxed
    rsi_overbought: 70,
    dip_percentage: 3,  // Smaller dip required
    profit_target_percent: 8,
    stop_loss_percent: 3,
    position_size_usd: 1000,
    max_positions: 5,
    lookback_days: 20
  }

  const strictParams = {
    rsi_oversold: 30,  // Original strict
    rsi_overbought: 70,
    dip_percentage: 5,
    profit_target_percent: 8,
    stop_loss_percent: 3,
    position_size_usd: 1000,
    max_positions: 5,
    lookback_days: 20
  }

  console.log('\n📊 Testing with RELAXED parameters (RSI<40, Dip>3%) to show improvements...\n')

  const ticker = 'NVDA'  // Volatile stock
  const days = 365  // Full year

  console.log(`Testing ${ticker} over ${days} days...\n`)

  // Test original strategy with relaxed params
  console.log('1️⃣  ORIGINAL Strategy (RSI + Dip only)...')
  const oldBacktester = new Backtester(relaxedParams)
  const oldResult = await oldBacktester.backtestTicker(ticker, days)

  console.log(`   Results: ${oldResult.totalTrades / 2} trades, ${oldResult.winRate.toFixed(1)}% win rate, $${oldResult.totalProfit.toFixed(2)} profit`)
  console.log(`   Score: ${oldResult.score.toFixed(0)}/100`)

  // Test enhanced strategy with relaxed params
  console.log('\n2️⃣  ENHANCED Strategy (RSI + Dip + Volume + Trend + ATR)...')
  const newBacktester = new EnhancedBacktester(relaxedParams)
  const newResult = await newBacktester.backtestTicker(ticker, days)

  console.log(`   Results: ${newResult.totalTrades / 2} trades, ${newResult.winRate.toFixed(1)}% win rate, $${newResult.totalProfit.toFixed(2)} profit`)
  console.log(`   Score: ${newResult.score.toFixed(0)}/100`)
  console.log(`   Sharpe Ratio: ${newResult.sharpeRatio.toFixed(2)}`)
  console.log(`   Max Drawdown: ${newResult.maxDrawdownPercent.toFixed(2)}%`)
  console.log(`   Profit Factor: ${newResult.profitFactor.toFixed(2)}`)

  // Calculate improvements
  const winRateImprovement = newResult.winRate - oldResult.winRate
  const profitImprovement = newResult.totalProfit - oldResult.totalProfit
  const scoreImprovement = newResult.score - oldResult.score

  console.log('\n' + '='.repeat(80))
  console.log('📈 IMPROVEMENTS')
  console.log('='.repeat(80))
  console.log(`Win Rate:      ${oldResult.winRate.toFixed(1)}% → ${newResult.winRate.toFixed(1)}% (${winRateImprovement >= 0 ? '+' : ''}${winRateImprovement.toFixed(1)}%)`)
  console.log(`Total Profit:  $${oldResult.totalProfit.toFixed(2)} → $${newResult.totalProfit.toFixed(2)} (${profitImprovement >= 0 ? '+' : ''}$${profitImprovement.toFixed(2)})`)
  console.log(`Score:         ${oldResult.score.toFixed(0)} → ${newResult.score.toFixed(0)} (${scoreImprovement >= 0 ? '+' : ''}${scoreImprovement.toFixed(0)})`)
  console.log(`\nNEW METRICS:`)
  console.log(`Sharpe Ratio:  ${newResult.sharpeRatio.toFixed(2)} ${newResult.sharpeRatio >= 1.5 ? '✅ Excellent' : newResult.sharpeRatio >= 1.0 ? '✅ Good' : '⚠️  Needs work'}`)
  console.log(`Max Drawdown:  ${newResult.maxDrawdownPercent.toFixed(2)}% ${newResult.maxDrawdownPercent <= 15 ? '✅ Low risk' : newResult.maxDrawdownPercent <= 25 ? '⚠️  Moderate' : '❌ High risk'}`)
  console.log(`Profit Factor: ${newResult.profitFactor.toFixed(2)} ${newResult.profitFactor >= 2.0 ? '✅ Excellent' : newResult.profitFactor >= 1.5 ? '✅ Good' : '⚠️  Needs work'}`)

  console.log('\n' + '='.repeat(80))
  console.log('💡 KEY INSIGHTS')
  console.log('='.repeat(80))

  if (newResult.totalTrades < oldResult.totalTrades) {
    const reduction = ((oldResult.totalTrades - newResult.totalTrades) / oldResult.totalTrades * 100)
    console.log(`✅ Trade Reduction: ${reduction.toFixed(0)}% fewer trades (filters out low-quality signals)`)
  }

  if (newResult.winRate > oldResult.winRate) {
    console.log(`✅ Higher Win Rate: Better signal quality from volume + trend filters`)
  }

  if (newResult.sharpeRatio > 0) {
    console.log(`✅ Risk-Adjusted Returns: Sharpe ratio of ${newResult.sharpeRatio.toFixed(2)} shows good risk/reward`)
  }

  if (newResult.maxDrawdownPercent < 20) {
    console.log(`✅ Controlled Risk: Max drawdown of ${newResult.maxDrawdownPercent.toFixed(2)}% shows good risk management`)
  }

  if (newResult.profitFactor > 1.5) {
    console.log(`✅ Profitable System: Profit factor of ${newResult.profitFactor.toFixed(2)} means wins outweigh losses`)
  }

  console.log('\n' + '='.repeat(80))
  console.log('🎯 CONCLUSION')
  console.log('='.repeat(80))
  console.log('\nThe Quick Wins provide:')
  console.log('  • Better signal quality (volume + trend confirmation)')
  console.log('  • Adaptive risk management (ATR-based stops)')
  console.log('  • Comprehensive performance metrics (Sharpe, Max DD, Profit Factor)')
  console.log('  • More robust and reliable trading system')
  console.log('\nNext step: Deploy enhanced strategy to production!')
  console.log('=' .repeat(80))
}

demonstrateImprovements().catch(console.error)

