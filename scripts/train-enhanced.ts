#!/usr/bin/env tsx
/**
 * Enhanced Training Script
 * Uses the new enhanced strategy with all Quick Wins
 */

import { EnhancedBacktester } from '../lib/enhanced-backtester'

async function main() {
  const args = process.argv.slice(2)
  
  // Parse arguments
  let tickers: string[] = ['AAPL', 'NVDA', 'TSLA', 'AMD', 'MSFT', 'WMT']
  let days = 180
  
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--tickers=')) {
      tickers = args[i].split('=')[1].split(',')
    } else if (args[i].startsWith('--days=')) {
      days = parseInt(args[i].split('=')[1])
    }
  }

  console.log('🚀 ENHANCED TRAINING SYSTEM')
  console.log('=' .repeat(80))
  console.log('Quick Wins Enabled:')
  console.log('  ✅ Volume Confirmation (1.5x average)')
  console.log('  ✅ Trend Filter (SMA 200)')
  console.log('  ✅ ATR-Based Stops (2x ATR)')
  console.log('  ✅ Sharpe Ratio Tracking')
  console.log('  ✅ Max Drawdown Monitoring')
  console.log('')
  console.log(`Testing ${tickers.length} tickers over ${days} days`)
  console.log('=' .repeat(80))
  console.log('')

  const backtester = new EnhancedBacktester()
  const results: any[] = []

  for (const ticker of tickers) {
    try {
      const result = await backtester.backtestTicker(ticker, days)
      results.push(result)
      
      // Save to database
      await backtester.saveBacktestResults(result)
    } catch (error) {
      console.error(`❌ Error testing ${ticker}:`, error)
    }
  }

  // Sort by score
  results.sort((a, b) => b.score - a.score)

  // Print results table
  console.log('\n' + '='.repeat(80))
  console.log('📊 ENHANCED BACKTEST RESULTS')
  console.log('='.repeat(80))
  console.log('')
  console.log('┌────────┬───────┬──────────┬──────────┬───────────┬────────┬─────────┬──────────┬─────────┐')
  console.log('│ Ticker │ Score │ Win Rate │ Total P/L│ Avg P/L   │ Sharpe │ Max DD  │ Profit F │ Status  │')
  console.log('├────────┼───────┼──────────┼──────────┼───────────┼────────┼─────────┼──────────┼─────────┤')

  for (const result of results) {
    const ticker = result.ticker.padEnd(6)
    const score = result.score.toFixed(0).padStart(5)
    const winRate = `${result.winRate.toFixed(1)}%`.padStart(8)
    const totalPL = `$${result.totalProfit.toFixed(2)}`.padStart(8)
    const avgPL = `$${result.avgProfit.toFixed(2)}`.padStart(9)
    const sharpe = result.sharpeRatio.toFixed(2).padStart(6)
    const maxDD = `${result.maxDrawdownPercent.toFixed(1)}%`.padStart(7)
    const profitF = result.profitFactor.toFixed(2).padStart(8)
    
    let status = ''
    if (result.score >= 70 && result.sharpeRatio >= 1.5) {
      status = '🟢 EXCELLENT'
    } else if (result.score >= 50 && result.sharpeRatio >= 1.0) {
      status = '🟡 GOOD'
    } else if (result.score >= 30) {
      status = '🟠 FAIR'
    } else {
      status = '🔴 POOR'
    }

    console.log(`│ ${ticker} │ ${score} │ ${winRate} │ ${totalPL} │ ${avgPL} │ ${sharpe} │ ${maxDD} │ ${profitF} │ ${status.padEnd(7)} │`)
  }

  console.log('└────────┴───────┴──────────┴──────────┴───────────┴────────┴─────────┴──────────┴─────────┘')

  // Print recommendations
  console.log('\n📈 RECOMMENDATIONS:')
  console.log('')

  const excellent = results.filter(r => r.score >= 70 && r.sharpeRatio >= 1.5)
  const good = results.filter(r => r.score >= 50 && r.sharpeRatio >= 1.0 && r.score < 70)
  const poor = results.filter(r => r.score < 30 || r.sharpeRatio < 0.5)

  if (excellent.length > 0) {
    console.log(`🟢 EXCELLENT (Add to watchlist): ${excellent.map(r => r.ticker).join(', ')}`)
    console.log(`   High score (≥70) + Strong Sharpe (≥1.5) + Good risk management`)
  }

  if (good.length > 0) {
    console.log(`🟡 GOOD (Consider adding): ${good.map(r => r.ticker).join(', ')}`)
    console.log(`   Decent performance but monitor closely`)
  }

  if (poor.length > 0) {
    console.log(`🔴 POOR (Avoid or remove): ${poor.map(r => r.ticker).join(', ')}`)
    console.log(`   Low score or negative Sharpe - not suitable for this strategy`)
  }

  // Print key metrics summary
  console.log('\n📊 SUMMARY STATISTICS:')
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length
  const avgSharpe = results.reduce((sum, r) => sum + r.sharpeRatio, 0) / results.length
  const avgMaxDD = results.reduce((sum, r) => sum + r.maxDrawdownPercent, 0) / results.length
  const avgProfitFactor = results.reduce((sum, r) => sum + r.profitFactor, 0) / results.length
  const avgWinRate = results.reduce((sum, r) => sum + r.winRate, 0) / results.length

  console.log(`   Average Score: ${avgScore.toFixed(1)}/100`)
  console.log(`   Average Sharpe Ratio: ${avgSharpe.toFixed(2)} ${avgSharpe >= 1.5 ? '✅' : avgSharpe >= 1.0 ? '⚠️' : '❌'}`)
  console.log(`   Average Max Drawdown: ${avgMaxDD.toFixed(2)}% ${avgMaxDD <= 15 ? '✅' : avgMaxDD <= 25 ? '⚠️' : '❌'}`)
  console.log(`   Average Profit Factor: ${avgProfitFactor.toFixed(2)} ${avgProfitFactor >= 2.0 ? '✅' : avgProfitFactor >= 1.5 ? '⚠️' : '❌'}`)
  console.log(`   Average Win Rate: ${avgWinRate.toFixed(1)}% ${avgWinRate >= 60 ? '✅' : avgWinRate >= 50 ? '⚠️' : '❌'}`)

  console.log('\n' + '='.repeat(80))
  console.log('✅ Enhanced Training Complete!')
  console.log('='.repeat(80))
  console.log('\nNext steps:')
  console.log('  1. Add EXCELLENT tickers to your watchlist')
  console.log('  2. Remove POOR performers')
  console.log('  3. Monitor GOOD tickers for improvement')
  console.log('  4. Run this weekly to adapt to market changes')
  console.log('')
}

main().catch(console.error)

