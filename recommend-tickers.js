/**
 * Analyze and recommend best tickers to trade
 * Run: node recommend-tickers.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jtcyaetmjdgosmgycwwh.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function analyzeTickers() {
  console.log('\n' + '═'.repeat(80));
  console.log('🎯 TICKER PERFORMANCE ANALYSIS & RECOMMENDATIONS');
  console.log('═'.repeat(80));
  console.log(`Generated: ${new Date().toLocaleString()}\n`);
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  // Get all trades
  const { data: trades } = await supabase
    .from('trades')
    .select('*')
    .gte('executed_at', startDate.toISOString())
    .order('executed_at', { ascending: true });
  
  // Get all signals
  const { data: signals } = await supabase
    .from('signal_history')
    .select('*')
    .gte('created_at', startDate.toISOString());
  
  if (!trades || trades.length === 0) {
    console.log('⚠️  No trades found in the last 30 days');
    console.log('💡 Run the bot for at least a week to get recommendations\n');
    return;
  }
  
  // Analyze by ticker
  const tickerStats = {};
  
  // Process trades
  const buysByTicker = {};
  trades.forEach(trade => {
    if (!tickerStats[trade.ticker]) {
      tickerStats[trade.ticker] = {
        ticker: trade.ticker,
        totalTrades: 0,
        buys: 0,
        sells: 0,
        totalProfit: 0,
        wins: 0,
        losses: 0,
        totalSignals: 0,
        executedSignals: 0,
        avgRSI: 0
      };
    }
    
    tickerStats[trade.ticker].totalTrades++;
    
    if (trade.side === 'buy') {
      tickerStats[trade.ticker].buys++;
      if (!buysByTicker[trade.ticker]) buysByTicker[trade.ticker] = [];
      buysByTicker[trade.ticker].push(trade);
    } else {
      tickerStats[trade.ticker].sells++;
    }
  });
  
  // Match buy/sell pairs
  Object.keys(buysByTicker).forEach(ticker => {
    const buys = buysByTicker[ticker];
    const sells = trades.filter(t => t.ticker === ticker && t.side === 'sell');
    
    sells.forEach(sell => {
      if (buys.length > 0) {
        const buy = buys.shift();
        const profit = (parseFloat(sell.price) - parseFloat(buy.price)) * parseFloat(sell.quantity);
        
        tickerStats[ticker].totalProfit += profit;
        if (profit > 0) {
          tickerStats[ticker].wins++;
        } else {
          tickerStats[ticker].losses++;
        }
      }
    });
  });
  
  // Process signals
  if (signals) {
    signals.forEach(signal => {
      if (tickerStats[signal.ticker]) {
        tickerStats[signal.ticker].totalSignals++;
        if (signal.was_executed) {
          tickerStats[signal.ticker].executedSignals++;
        }
      }
    });
  }
  
  // Calculate metrics and scores
  Object.values(tickerStats).forEach(stats => {
    const completedTrades = stats.wins + stats.losses;
    
    if (completedTrades > 0) {
      stats.winRate = (stats.wins / completedTrades) * 100;
      stats.avgProfit = stats.totalProfit / completedTrades;
    } else {
      stats.winRate = 0;
      stats.avgProfit = 0;
    }
    
    // Calculate score
    const winRateScore = stats.winRate * 0.4;
    const profitScore = Math.min(Math.max(stats.avgProfit / 10, -10), 10) * 3;
    const executionRate = stats.totalSignals > 0 ? (stats.executedSignals / stats.totalSignals) * 100 : 0;
    const executionScore = executionRate * 0.2;
    const volumeScore = Math.min(completedTrades / 10, 1) * 10;
    
    stats.score = Math.max(0, Math.min(100, winRateScore + profitScore + executionScore + volumeScore));
    stats.executionRate = executionRate;
  });
  
  // Sort by score
  const rankedTickers = Object.values(tickerStats)
    .filter(stats => stats.totalSignals > 0)
    .sort((a, b) => b.score - a.score);
  
  // Display results
  console.log('📊 TICKER PERFORMANCE RANKING (Last 30 Days)');
  console.log('─'.repeat(80));
  console.log('Rank | Ticker | Score | Win Rate | Avg P/L | Total P/L | Trades | Signals');
  console.log('─'.repeat(80));
  
  rankedTickers.forEach((stats, index) => {
    const rank = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
    const scoreColor = stats.score >= 70 ? '🟢' : stats.score >= 40 ? '🟡' : '🔴';
    const profitColor = stats.totalProfit >= 0 ? '🟢' : '🔴';
    
    console.log(
      `${rank.padEnd(5)} | ${stats.ticker.padEnd(6)} | ${scoreColor} ${stats.score.toFixed(0).padStart(3)} | ` +
      `${stats.winRate.toFixed(1).padStart(5)}% | ` +
      `${profitColor} $${stats.avgProfit.toFixed(2).padStart(6)} | ` +
      `$${stats.totalProfit.toFixed(2).padStart(7)} | ` +
      `${(stats.wins + stats.losses).toString().padStart(6)} | ` +
      `${stats.totalSignals.toString().padStart(7)}`
    );
  });
  
  // Recommendations
  console.log(`\n💡 RECOMMENDATIONS`);
  console.log('─'.repeat(80));
  
  const topPerformers = rankedTickers.filter(s => s.score >= 70);
  const poorPerformers = rankedTickers.filter(s => s.score < 30);
  
  if (topPerformers.length > 0) {
    console.log(`\n✅ KEEP THESE (Score ≥ 70):`);
    topPerformers.forEach(stats => {
      console.log(`   ${stats.ticker}: Score ${stats.score.toFixed(0)} | Win Rate ${stats.winRate.toFixed(1)}% | Total P/L $${stats.totalProfit.toFixed(2)}`);
    });
  }
  
  if (poorPerformers.length > 0) {
    console.log(`\n⚠️  CONSIDER REMOVING (Score < 30):`);
    poorPerformers.forEach(stats => {
      console.log(`   ${stats.ticker}: Score ${stats.score.toFixed(0)} | Win Rate ${stats.winRate.toFixed(1)}% | Total P/L $${stats.totalProfit.toFixed(2)}`);
    });
  }
  
  const mediumPerformers = rankedTickers.filter(s => s.score >= 30 && s.score < 70);
  if (mediumPerformers.length > 0) {
    console.log(`\n📊 MONITOR THESE (Score 30-70):`);
    mediumPerformers.forEach(stats => {
      console.log(`   ${stats.ticker}: Score ${stats.score.toFixed(0)} | Give it more time to prove itself`);
    });
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log('💡 TIP: Focus on tickers with Score ≥ 70 and remove those with Score < 30');
  console.log('═'.repeat(80) + '\n');
}

analyzeTickers().catch(console.error);

