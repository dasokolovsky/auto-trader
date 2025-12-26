/**
 * Test Enhanced Strategy vs Original Strategy
 * Compare performance improvements from Quick Wins
 */

import { Backtester } from '../lib/backtester'
import { EnhancedBacktester } from '../lib/enhanced-backtester'

interface ComparisonResult {
  ticker: string
  old: {
    trades: number
    winRate: number
    profit: number
    score: number
  }
  new: {
    trades: number
    winRate: number
    profit: number
    score: number
    sharpe: number
    maxDD: number
    profitFactor: number
  }
  improvement: {
    winRate: number
    profit: number
    score: number
    sharpe: number
  }
}

async function compareStrategies() {
  console.log('🔬 ENHANCED STRATEGY TEST - Quick Wins Comparison\n')
  console.log('Testing 5 improvements:')
  console.log('  1. ✅ Volume Confirmation (1.5x average)')
  console.log('  2. ✅ Trend Filter (SMA 200)')
  console.log('  3. ✅ ATR-Based Stops (2x ATR)')
  console.log('  4. ✅ Sharpe Ratio Tracking')
  console.log('  5. ✅ Max Drawdown Monitoring\n')
  console.log('=' .repeat(80))

  // Test tickers - mix of different market conditions
  const testTickers = ['AAPL', 'NVDA', 'TSLA', 'WMT', 'AMD', 'MSFT']
  const testDays = 180  // 6 months of data

  // Use same parameters for fair comparison
  const params = {
    rsi_oversold: 30,
    rsi_overbought: 70,
    dip_percentage: 5,
    profit_target_percent: 8,
    stop_loss_percent: 3,
    position_size_usd: 1000,
    max_positions: 5,
    lookback_days: 20
  }

  const oldBacktester = new Backtester(params)
  const newBacktester = new EnhancedBacktester(params)

  const results: ComparisonResult[] = []

  for (const ticker of testTickers) {
    console.log(`\n📊 Testing ${ticker}...`)
    console.log('-'.repeat(80))

    try {
      // Run old strategy
      console.log('  Running ORIGINAL strategy...')
      const oldResult = await oldBacktester.backtestTicker(ticker, testDays)

      // Run new enhanced strategy
      console.log('  Running ENHANCED strategy...')
      const newResult = await newBacktester.backtestTicker(ticker, testDays)

      // Calculate improvements
      const winRateImprovement = newResult.winRate - oldResult.winRate
      const profitImprovement = newResult.totalProfit - oldResult.totalProfit
      const scoreImprovement = newResult.score - oldResult.score

      results.push({
        ticker,
        old: {
          trades: oldResult.totalTrades / 2,  // Divide by 2 (buy+sell)
          winRate: oldResult.winRate,
          profit: oldResult.totalProfit,
          score: oldResult.score
        },
        new: {
          trades: newResult.totalTrades / 2,
          winRate: newResult.winRate,
          profit: newResult.totalProfit,
          score: newResult.score,
          sharpe: newResult.sharpeRatio,
          maxDD: newResult.maxDrawdownPercent,
          profitFactor: newResult.profitFactor
        },
        improvement: {
          winRate: winRateImprovement,
          profit: profitImprovement,
          score: scoreImprovement,
          sharpe: newResult.sharpeRatio
        }
      })

      // Print comparison
      console.log('\n  📈 RESULTS:')
      console.log(`     Original: ${oldResult.totalTrades / 2} trades, ${oldResult.winRate.toFixed(1)}% win rate, $${oldResult.totalProfit.toFixed(2)} profit, Score: ${oldResult.score.toFixed(0)}`)
      console.log(`     Enhanced: ${newResult.totalTrades / 2} trades, ${newResult.winRate.toFixed(1)}% win rate, $${newResult.totalProfit.toFixed(2)} profit, Score: ${newResult.score.toFixed(0)}`)
      console.log(`     New Metrics: Sharpe ${newResult.sharpeRatio.toFixed(2)}, Max DD ${newResult.maxDrawdownPercent.toFixed(2)}%, PF ${newResult.profitFactor.toFixed(2)}`)
      console.log(`     Improvement: ${winRateImprovement >= 0 ? '+' : ''}${winRateImprovement.toFixed(1)}% win rate, ${profitImprovement >= 0 ? '+' : ''}$${profitImprovement.toFixed(2)} profit, ${scoreImprovement >= 0 ? '+' : ''}${scoreImprovement.toFixed(0)} score`)

    } catch (error) {
      console.error(`  ❌ Error testing ${ticker}:`, error)
    }
  }

  // Print summary table
  console.log('\n\n' + '='.repeat(80))
  console.log('📊 SUMMARY - Old vs Enhanced Strategy Comparison')
  console.log('='.repeat(80))
  console.log('')
  console.log('┌──────────┬─────────────────────────────┬─────────────────────────────────────────────┬──────────────────┐')
  console.log('│  Ticker  │         ORIGINAL            │              ENHANCED                       │   IMPROVEMENT    │')
  console.log('├──────────┼─────────────────────────────┼─────────────────────────────────────────────┼──────────────────┤')
  console.log('│          │ Trades  WinRate  Profit     │ Trades  WinRate  Profit  Sharpe  MaxDD  PF │ WinRate  Profit  │')
  console.log('├──────────┼─────────────────────────────┼─────────────────────────────────────────────┼──────────────────┤')

  for (const result of results) {
    const oldLine = `${result.old.trades.toString().padStart(2)} ${result.old.winRate.toFixed(0).padStart(6)}% ${('$' + result.old.profit.toFixed(0)).padStart(8)}`
    const newLine = `${result.new.trades.toString().padStart(2)} ${result.new.winRate.toFixed(0).padStart(6)}% ${('$' + result.new.profit.toFixed(0)).padStart(8)} ${result.new.sharpe.toFixed(2).padStart(6)} ${result.new.maxDD.toFixed(1).padStart(5)}% ${result.new.profitFactor.toFixed(2).padStart(4)}`
    const impLine = `${(result.improvement.winRate >= 0 ? '+' : '') + result.improvement.winRate.toFixed(0).padStart(5)}% ${(result.improvement.profit >= 0 ? '+$' : '-$') + Math.abs(result.improvement.profit).toFixed(0).padStart(6)}`
    
    console.log(`│ ${result.ticker.padEnd(8)} │ ${oldLine} │ ${newLine} │ ${impLine} │`)
  }

  console.log('└──────────┴─────────────────────────────┴─────────────────────────────────────────────┴──────────────────┘')

  // Calculate averages
  const avgOldWinRate = results.reduce((sum, r) => sum + r.old.winRate, 0) / results.length
  const avgNewWinRate = results.reduce((sum, r) => sum + r.new.winRate, 0) / results.length
  const avgOldProfit = results.reduce((sum, r) => sum + r.old.profit, 0) / results.length
  const avgNewProfit = results.reduce((sum, r) => sum + r.new.profit, 0) / results.length
  const avgSharpe = results.reduce((sum, r) => sum + r.new.sharpe, 0) / results.length
  const avgMaxDD = results.reduce((sum, r) => sum + r.new.maxDD, 0) / results.length
  const avgPF = results.reduce((sum, r) => sum + r.new.profitFactor, 0) / results.length

  console.log('\n📈 AVERAGE PERFORMANCE:')
  console.log(`   Original: ${avgOldWinRate.toFixed(1)}% win rate, $${avgOldProfit.toFixed(2)} avg profit`)
  console.log(`   Enhanced: ${avgNewWinRate.toFixed(1)}% win rate, $${avgNewProfit.toFixed(2)} avg profit`)
  console.log(`   New Metrics: Sharpe ${avgSharpe.toFixed(2)}, Max DD ${avgMaxDD.toFixed(2)}%, Profit Factor ${avgPF.toFixed(2)}`)
  console.log(`   Improvement: ${(avgNewWinRate - avgOldWinRate >= 0 ? '+' : '')}${(avgNewWinRate - avgOldWinRate).toFixed(1)}% win rate, ${(avgNewProfit - avgOldProfit >= 0 ? '+' : '')}$${(avgNewProfit - avgOldProfit).toFixed(2)} profit`)

  // Overall assessment
  console.log('\n🎯 ASSESSMENT:')
  const winRateImprovement = ((avgNewWinRate - avgOldWinRate) / avgOldWinRate) * 100
  const profitImprovement = ((avgNewProfit - avgOldProfit) / Math.abs(avgOldProfit)) * 100

  if (avgSharpe > 1.5) {
    console.log(`   ✅ Excellent Sharpe Ratio (${avgSharpe.toFixed(2)}) - Risk-adjusted returns are strong`)
  } else if (avgSharpe > 1.0) {
    console.log(`   ✅ Good Sharpe Ratio (${avgSharpe.toFixed(2)}) - Decent risk-adjusted returns`)
  } else {
    console.log(`   ⚠️  Low Sharpe Ratio (${avgSharpe.toFixed(2)}) - Consider further optimization`)
  }

  if (avgMaxDD < 15) {
    console.log(`   ✅ Low Max Drawdown (${avgMaxDD.toFixed(2)}%) - Good risk management`)
  } else if (avgMaxDD < 25) {
    console.log(`   ⚠️  Moderate Max Drawdown (${avgMaxDD.toFixed(2)}%) - Acceptable but could improve`)
  } else {
    console.log(`   ❌ High Max Drawdown (${avgMaxDD.toFixed(2)}%) - Risk management needs work`)
  }

  if (avgPF > 2.0) {
    console.log(`   ✅ Excellent Profit Factor (${avgPF.toFixed(2)}) - Wins significantly outweigh losses`)
  } else if (avgPF > 1.5) {
    console.log(`   ✅ Good Profit Factor (${avgPF.toFixed(2)}) - Profitable overall`)
  } else {
    console.log(`   ⚠️  Low Profit Factor (${avgPF.toFixed(2)}) - Needs improvement`)
  }

  console.log('\n' + '='.repeat(80))
  console.log('✅ Test Complete!')
  console.log('='.repeat(80))
}

// Run the comparison
compareStrategies().catch(console.error)

