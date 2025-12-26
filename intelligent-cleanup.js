/**
 * Intelligent Watchlist Cleanup
 * Analyzes and removes poor-performing tickers
 * Run: node intelligent-cleanup.js [--dry-run]
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jtcyaetmjdgosmgycwwh.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const DRY_RUN = process.argv.includes('--dry-run');

// Thresholds
const MIN_TRADES_FOR_EVALUATION = 3;
const REMOVE_SCORE = 20;

async function analyzeTickerPerformance(ticker, lookbackDays = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - lookbackDays);
  
  const { data: trades } = await supabase
    .from('trades')
    .select('*')
    .eq('ticker', ticker)
    .gte('executed_at', startDate.toISOString())
    .order('executed_at', { ascending: true });
  
  if (!trades || trades.length === 0) {
    return {
      ticker,
      totalTrades: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      totalProfit: 0,
      avgProfit: 0,
      score: 50,
      status: 'unproven'
    };
  }
  
  const buys = trades.filter(t => t.side === 'buy');
  const sells = trades.filter(t => t.side === 'sell');
  
  let wins = 0;
  let losses = 0;
  let totalProfit = 0;
  
  sells.forEach(sell => {
    if (buys.length > 0) {
      const buy = buys.shift();
      const profit = (parseFloat(sell.price) - parseFloat(buy.price)) * parseFloat(sell.quantity);
      totalProfit += profit;
      
      if (profit > 0) wins++;
      else losses++;
    }
  });
  
  const completedTrades = wins + losses;
  const winRate = completedTrades > 0 ? (wins / completedTrades) * 100 : 0;
  const avgProfit = completedTrades > 0 ? totalProfit / completedTrades : 0;
  
  // Calculate score
  const winRateScore = winRate * 0.5;
  const profitScore = Math.min(Math.max(avgProfit / 10, -10), 10) * 3;
  const volumeScore = Math.min(completedTrades / 10, 1) * 20;
  
  const score = Math.max(0, Math.min(100, winRateScore + profitScore + volumeScore));
  
  let status;
  if (completedTrades < MIN_TRADES_FOR_EVALUATION) {
    status = 'unproven';
  } else if (score >= 70) {
    status = 'excellent';
  } else if (score >= 30) {
    status = 'good';
  } else {
    status = 'poor';
  }
  
  return {
    ticker,
    totalTrades: trades.length,
    wins,
    losses,
    winRate,
    totalProfit,
    avgProfit,
    completedTrades,
    score,
    status
  };
}

async function shouldRemoveFromWatchlist(performance) {
  if (performance.status === 'unproven') {
    return { shouldRemove: false, reason: 'Not enough data yet' };
  }
  
  if (performance.score < REMOVE_SCORE) {
    return { 
      shouldRemove: true, 
      reason: `Critically poor performance (Score: ${performance.score.toFixed(0)}, Win Rate: ${performance.winRate.toFixed(1)}%, Total P/L: $${performance.totalProfit.toFixed(2)})` 
    };
  }
  
  if (performance.completedTrades >= 5 && performance.winRate < 25) {
    return { 
      shouldRemove: true, 
      reason: `Consistent loser (${performance.wins}W/${performance.losses}L, Win Rate: ${performance.winRate.toFixed(1)}%)` 
    };
  }
  
  return { shouldRemove: false, reason: 'Performance acceptable' };
}

async function intelligentCleanup() {
  console.log('\n' + '═'.repeat(80));
  console.log('🧠 INTELLIGENT WATCHLIST CLEANUP');
  console.log('═'.repeat(80));
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes will be made)' : 'LIVE (will remove tickers)'}`);
  console.log(`Generated: ${new Date().toLocaleString()}\n`);
  
  const { data: watchlist } = await supabase
    .from('watchlist')
    .select('*')
    .eq('is_active', true);
  
  if (!watchlist || watchlist.length === 0) {
    console.log('⚠️  No active tickers in watchlist\n');
    return;
  }
  
  console.log(`📊 Analyzing ${watchlist.length} tickers...\n`);
  
  const toRemove = [];
  const toKeep = [];
  
  for (const item of watchlist) {
    const performance = await analyzeTickerPerformance(item.ticker);
    const decision = await shouldRemoveFromWatchlist(performance);
    
    if (decision.shouldRemove) {
      toRemove.push({ ticker: item.ticker, performance, reason: decision.reason, id: item.id });
    } else {
      toKeep.push({ ticker: item.ticker, performance, reason: decision.reason });
    }
  }
  
  // Display results
  console.log('═'.repeat(80));
  console.log('📋 ANALYSIS RESULTS');
  console.log('═'.repeat(80));
  console.log(`Total Tickers: ${watchlist.length}`);
  console.log(`✅ Keep: ${toKeep.length}`);
  console.log(`🗑️  Remove: ${toRemove.length}\n`);
  
  if (toRemove.length > 0) {
    console.log('⚠️  TICKERS TO REMOVE:');
    console.log('─'.repeat(80));
    toRemove.forEach(item => {
      console.log(`\n${item.ticker} - Score: ${item.performance.score.toFixed(0)} | Status: ${item.performance.status.toUpperCase()}`);
      console.log(`  Reason: ${item.reason}`);
      console.log(`  Stats: ${item.performance.wins}W/${item.performance.losses}L | Win Rate: ${item.performance.winRate.toFixed(1)}% | Total P/L: $${item.performance.totalProfit.toFixed(2)}`);
    });
    console.log('\n' + '─'.repeat(80));
    
    if (!DRY_RUN) {
      console.log('\n🗑️  Removing tickers from watchlist...');
      
      for (const item of toRemove) {
        await supabase
          .from('watchlist')
          .update({ is_active: false })
          .eq('id', item.id);
        
        console.log(`   ✓ Removed ${item.ticker}`);
      }
      
      console.log(`\n✅ Cleanup complete! Removed ${toRemove.length} tickers.`);
    } else {
      console.log('\n💡 DRY RUN: No changes made. Run without --dry-run to execute.');
    }
  } else {
    console.log('✅ All tickers are performing acceptably. No cleanup needed.');
  }
  
  if (toKeep.length > 0) {
    console.log('\n✅ TICKERS TO KEEP:');
    console.log('─'.repeat(80));
    toKeep.sort((a, b) => b.performance.score - a.performance.score);
    
    toKeep.forEach((item, index) => {
      const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
      const scoreColor = item.performance.score >= 70 ? '🟢' : item.performance.score >= 40 ? '🟡' : '🟠';
      
      console.log(
        `${emoji} ${item.ticker.padEnd(6)} | ${scoreColor} Score: ${item.performance.score.toFixed(0).padStart(3)} | ` +
        `Win Rate: ${item.performance.winRate.toFixed(1).padStart(5)}% | ` +
        `P/L: $${item.performance.totalProfit.toFixed(2).padStart(7)} | ` +
        `${item.performance.status.toUpperCase()}`
      );
    });
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log('💡 TIP: Run this weekly to keep your watchlist optimized');
  console.log('═'.repeat(80) + '\n');
}

intelligentCleanup().catch(console.error);

