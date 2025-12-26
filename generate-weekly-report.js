/**
 * Generate comprehensive weekly performance report
 * Run with: node generate-weekly-report.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jtcyaetmjdgosmgycwwh.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function generateWeeklyReport() {
  console.log('\n' + '═'.repeat(80));
  console.log('📊 AUTO TRADER - WEEKLY PERFORMANCE REPORT');
  console.log('═'.repeat(80));
  console.log(`Generated: ${new Date().toLocaleString()}\n`);
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);
  
  // Fetch all data
  const [
    { data: trades },
    { data: signals },
    { data: executions },
    { data: snapshots }
  ] = await Promise.all([
    supabase.from('trades').select('*').gte('executed_at', startDate.toISOString()).order('executed_at'),
    supabase.from('signal_history').select('*').gte('created_at', startDate.toISOString()),
    supabase.from('execution_log').select('*').gte('executed_at', startDate.toISOString()),
    supabase.from('portfolio_snapshots').select('*').gte('snapshot_date', startDate.toISOString().split('T')[0]).order('snapshot_date')
  ]);
  
  // 1. EXECUTIVE SUMMARY
  console.log('📈 EXECUTIVE SUMMARY');
  console.log('─'.repeat(80));
  
  if (snapshots && snapshots.length > 0) {
    const startValue = snapshots[0].portfolio_value;
    const endValue = snapshots[snapshots.length - 1].portfolio_value;
    const weeklyReturn = ((endValue - startValue) / startValue) * 100;
    
    console.log(`  Starting Portfolio Value: $${parseFloat(startValue).toLocaleString()}`);
    console.log(`  Ending Portfolio Value:   $${parseFloat(endValue).toLocaleString()}`);
    console.log(`  Weekly Return: ${weeklyReturn >= 0 ? '🟢' : '🔴'} ${weeklyReturn >= 0 ? '+' : ''}${weeklyReturn.toFixed(2)}%`);
    console.log(`  Absolute P/L: ${weeklyReturn >= 0 ? '🟢' : '🔴'} $${(endValue - startValue).toFixed(2)}`);
  } else {
    console.log('  ⚠️  No portfolio snapshots available');
  }
  
  // 2. TRADING ACTIVITY
  console.log(`\n📊 TRADING ACTIVITY`);
  console.log('─'.repeat(80));
  console.log(`  Strategy Executions: ${executions?.length || 0}`);
  console.log(`  Market Open Days: ${executions?.filter(e => e.market_open).length || 0}`);
  console.log(`  Total Signals: ${signals?.length || 0}`);
  console.log(`  - Buy Signals: ${signals?.filter(s => s.signal_type === 'BUY').length || 0}`);
  console.log(`  - Sell Signals: ${signals?.filter(s => s.signal_type === 'SELL').length || 0}`);
  console.log(`  - Hold Signals: ${signals?.filter(s => s.signal_type === 'HOLD').length || 0}`);
  console.log(`  Trades Executed: ${trades?.length || 0}`);
  console.log(`  - Buys: ${trades?.filter(t => t.side === 'buy').length || 0}`);
  console.log(`  - Sells: ${trades?.filter(t => t.side === 'sell').length || 0}`);
  
  // 3. SIGNAL ANALYSIS
  if (signals && signals.length > 0) {
    console.log(`\n🎯 SIGNAL EFFECTIVENESS`);
    console.log('─'.repeat(80));
    
    const executedSignals = signals.filter(s => s.was_executed);
    const executionRate = (executedSignals.length / signals.length) * 100;
    
    console.log(`  Signal Execution Rate: ${executionRate.toFixed(1)}%`);
    console.log(`  Signals Generated but Not Executed: ${signals.length - executedSignals.length}`);
    
    // Group by ticker
    const signalsByTicker = {};
    signals.forEach(s => {
      if (!signalsByTicker[s.ticker]) {
        signalsByTicker[s.ticker] = { total: 0, buy: 0, sell: 0, hold: 0, executed: 0 };
      }
      signalsByTicker[s.ticker].total++;
      signalsByTicker[s.ticker][s.signal_type.toLowerCase()]++;
      if (s.was_executed) signalsByTicker[s.ticker].executed++;
    });
    
    console.log(`\n  By Ticker:`);
    Object.entries(signalsByTicker).forEach(([ticker, stats]) => {
      console.log(`    ${ticker}: ${stats.total} signals (${stats.buy}B/${stats.sell}S/${stats.hold}H) - ${stats.executed} executed`);
    });
  }
  
  // 4. TRADE PERFORMANCE
  if (trades && trades.length > 0) {
    const buyTrades = trades.filter(t => t.side === 'buy');
    const sellTrades = trades.filter(t => t.side === 'sell');
    
    console.log(`\n💰 TRADE PERFORMANCE`);
    console.log('─'.repeat(80));
    
    // Match trades
    const completedTrades = [];
    const buysByTicker = {};
    
    buyTrades.forEach(buy => {
      if (!buysByTicker[buy.ticker]) buysByTicker[buy.ticker] = [];
      buysByTicker[buy.ticker].push(buy);
    });
    
    sellTrades.forEach(sell => {
      const buyQueue = buysByTicker[sell.ticker] || [];
      if (buyQueue.length > 0) {
        const buy = buyQueue.shift();
        const profit = (parseFloat(sell.price) - parseFloat(buy.price)) * parseFloat(sell.quantity);
        const profitPercent = ((parseFloat(sell.price) - parseFloat(buy.price)) / parseFloat(buy.price)) * 100;
        
        completedTrades.push({
          ticker: sell.ticker,
          profit,
          profitPercent,
          buyReason: buy.strategy_params?.reason || 'N/A',
          sellReason: sell.strategy_params?.reason || 'N/A'
        });
      }
    });
    
    if (completedTrades.length > 0) {
      const totalProfit = completedTrades.reduce((sum, t) => sum + t.profit, 0);
      const winners = completedTrades.filter(t => t.profit > 0);
      const losers = completedTrades.filter(t => t.profit < 0);
      const winRate = (winners.length / completedTrades.length) * 100;
      
      console.log(`  Completed Trades: ${completedTrades.length}`);
      console.log(`  Win Rate: ${winRate.toFixed(1)}% (${winners.length}W / ${losers.length}L)`);
      console.log(`  Total P/L: ${totalProfit >= 0 ? '🟢' : '🔴'} $${totalProfit.toFixed(2)}`);
      console.log(`  Avg P/L per Trade: $${(totalProfit / completedTrades.length).toFixed(2)}`);
      
      if (winners.length > 0) {
        console.log(`  Best Trade: +$${Math.max(...winners.map(t => t.profit)).toFixed(2)}`);
      }
      if (losers.length > 0) {
        console.log(`  Worst Trade: $${Math.min(...losers.map(t => t.profit)).toFixed(2)}`);
      }
    } else {
      console.log(`  No completed trades (${buyTrades.length} open positions)`);
    }
  }
  
  // 5. RECOMMENDATIONS
  console.log(`\n💡 RECOMMENDATIONS`);
  console.log('─'.repeat(80));
  
  const recommendations = [];
  
  if (!trades || trades.length === 0) {
    recommendations.push('⚠️  No trades executed - strategy may be too conservative');
    recommendations.push('   Consider relaxing entry criteria (lower RSI threshold or dip %)');
  }
  
  if (signals && signals.length > 0) {
    const executionRate = (signals.filter(s => s.was_executed).length / signals.length) * 100;
    if (executionRate < 20) {
      recommendations.push('⚠️  Low signal execution rate - many signals not being acted on');
      recommendations.push('   Check if max_positions limit is being hit or insufficient capital');
    }
  }
  
  if (trades && trades.length > 0) {
    const sellTrades = trades.filter(t => t.side === 'sell');
    const stopLosses = sellTrades.filter(t => t.strategy_params?.reason?.includes('Stop Loss'));
    if (stopLosses.length > sellTrades.length * 0.6) {
      recommendations.push('⚠️  High stop loss rate - consider widening stop loss percentage');
    }
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✅ Strategy is performing as expected');
    recommendations.push('   Continue monitoring for another week before making changes');
  }
  
  recommendations.forEach(rec => console.log(`  ${rec}`));
  
  console.log('\n' + '═'.repeat(80));
  console.log('End of Report\n');
}

generateWeeklyReport().catch(console.error);

