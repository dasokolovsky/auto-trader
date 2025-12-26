#!/usr/bin/env node

/**
 * Auto-Trader Monitoring Script
 * 
 * Usage:
 *   node monitor.js              # One-time status check
 *   node monitor.js --watch      # Continuous monitoring (every 5 minutes)
 *   node monitor.js --summary    # Daily summary
 */

const BASE_URL = 'https://auto-trader-umber.vercel.app'

async function fetchJSON(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error(`❌ Error fetching ${endpoint}:`, error.message)
    return null
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

function formatPercent(value) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

async function getAccountStatus() {
  console.log('\n📊 ACCOUNT STATUS')
  console.log('═'.repeat(60))
  
  const data = await fetchJSON('/api/account')
  if (!data || !data.account) {
    console.log('❌ Unable to fetch account data')
    return
  }
  
  const { equity, cash, buying_power, portfolio_value } = data.account
  
  console.log(`💰 Equity:        ${formatCurrency(equity)}`)
  console.log(`💵 Cash:          ${formatCurrency(cash)}`)
  console.log(`⚡ Buying Power:  ${formatCurrency(buying_power)}`)
  console.log(`📈 Portfolio:     ${formatCurrency(portfolio_value)}`)
  
  const invested = parseFloat(equity) - parseFloat(cash)
  if (invested > 0) {
    console.log(`🎯 Invested:      ${formatCurrency(invested)}`)
  }
}

async function getPositions() {
  console.log('\n📍 ACTIVE POSITIONS')
  console.log('═'.repeat(60))
  
  const data = await fetchJSON('/api/positions')
  if (!data || !data.positions) {
    console.log('❌ Unable to fetch positions')
    return
  }
  
  if (data.positions.length === 0) {
    console.log('📭 No active positions')
    return
  }
  
  console.log(`\nTotal Positions: ${data.positions.length}\n`)
  
  data.positions.forEach(pos => {
    const pnl = parseFloat(pos.unrealized_pl || 0)
    const pnlPercent = parseFloat(pos.unrealized_plpc || 0) * 100
    const pnlEmoji = pnl >= 0 ? '📈' : '📉'
    
    console.log(`${pnlEmoji} ${pos.symbol}`)
    console.log(`   Qty: ${pos.qty} @ ${formatCurrency(pos.avg_entry_price)}`)
    console.log(`   Current: ${formatCurrency(pos.current_price)}`)
    console.log(`   P&L: ${formatCurrency(pnl)} (${formatPercent(pnlPercent)})`)
    console.log()
  })
}

async function getWatchlist() {
  console.log('\n👀 WATCHLIST')
  console.log('═'.repeat(60))
  
  const data = await fetchJSON('/api/watchlist')
  if (!data || !data.watchlist) {
    console.log('❌ Unable to fetch watchlist')
    return
  }
  
  if (data.watchlist.length === 0) {
    console.log('📭 Watchlist is empty')
    return
  }
  
  console.log(`\nMonitoring ${data.watchlist.length} stocks:\n`)
  
  data.watchlist.forEach(item => {
    const addedDate = new Date(item.added_at).toLocaleDateString()
    console.log(`  • ${item.ticker} (added ${addedDate})`)
  })
}

async function getRecentTrades() {
  console.log('\n📝 RECENT TRADES')
  console.log('═'.repeat(60))
  
  const data = await fetchJSON('/api/trades')
  if (!data || !data.trades) {
    console.log('❌ Unable to fetch trades')
    return
  }
  
  if (data.trades.length === 0) {
    console.log('📭 No trades yet')
    return
  }
  
  const recentTrades = data.trades.slice(0, 5)
  console.log(`\nShowing ${recentTrades.length} most recent trades:\n`)
  
  recentTrades.forEach(trade => {
    const date = new Date(trade.created_at).toLocaleString()
    const side = trade.side === 'buy' ? '🟢 BUY ' : '🔴 SELL'
    
    console.log(`${side} ${trade.ticker}`)
    console.log(`   ${trade.quantity} shares @ ${formatCurrency(trade.price)}`)
    console.log(`   ${date}`)
    
    if (trade.profit_loss) {
      const pl = parseFloat(trade.profit_loss)
      const emoji = pl >= 0 ? '✅' : '❌'
      console.log(`   ${emoji} P&L: ${formatCurrency(pl)}`)
    }
    console.log()
  })
}

async function getPerformance() {
  console.log('\n📊 PERFORMANCE METRICS')
  console.log('═'.repeat(60))
  
  const data = await fetchJSON('/api/analytics/performance')
  if (!data) {
    console.log('❌ Unable to fetch performance data')
    return
  }
  
  console.log(`\n📈 Total Return:    ${formatPercent(data.totalReturn || 0)}`)
  console.log(`🎯 Win Rate:        ${formatPercent(data.winRate || 0)}`)
  console.log(`⚡ Sharpe Ratio:    ${(data.sharpeRatio || 0).toFixed(2)}`)
  console.log(`📉 Max Drawdown:    ${formatPercent(data.maxDrawdown || 0)}`)
  console.log(`💪 Profit Factor:   ${(data.profitFactor || 0).toFixed(2)}`)
  console.log(`📊 Total Trades:    ${data.totalTrades || 0}`)
}

async function getBotStatus() {
  console.log('\n🤖 BOT STATUS')
  console.log('═'.repeat(60))
  
  const data = await fetchJSON('/api/bot/status')
  if (!data) {
    console.log('❌ Unable to fetch bot status')
    return
  }
  
  const statusEmoji = data.status === 'active' ? '✅' : '⚠️'
  console.log(`\n${statusEmoji} Status: ${data.status || 'unknown'}`)
  
  if (data.lastRun) {
    const lastRun = new Date(data.lastRun).toLocaleString()
    console.log(`⏰ Last Run: ${lastRun}`)
  }
  
  if (data.nextRun) {
    const nextRun = new Date(data.nextRun).toLocaleString()
    console.log(`⏭️  Next Run: ${nextRun}`)
  }
}

async function fullStatus() {
  console.clear()
  console.log('🚀 AUTO-TRADER MONITORING')
  console.log('═'.repeat(60))
  console.log(`⏰ ${new Date().toLocaleString()}`)
  
  await getAccountStatus()
  await getPositions()
  await getWatchlist()
  await getRecentTrades()
  await getPerformance()
  await getBotStatus()
  
  console.log('\n' + '═'.repeat(60))
  console.log('✅ Status check complete!')
  console.log('═'.repeat(60) + '\n')
}

async function watchMode() {
  console.log('👀 Starting continuous monitoring (every 5 minutes)...')
  console.log('Press Ctrl+C to stop\n')
  
  await fullStatus()
  
  setInterval(async () => {
    await fullStatus()
  }, 5 * 60 * 1000) // 5 minutes
}

// Main
const args = process.argv.slice(2)

if (args.includes('--watch')) {
  watchMode()
} else if (args.includes('--summary')) {
  (async () => {
    await getAccountStatus()
    await getPerformance()
  })()
} else {
  fullStatus()
}

