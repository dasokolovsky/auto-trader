/**
 * Analyze trading performance after running for a period
 * Run with: node analyze-performance.js [days]
 * Example: node analyze-performance.js 7
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jtcyaetmjdgosmgycwwh.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function analyzePerformance(days = 7) {
  console.log(`\n📊 PERFORMANCE ANALYSIS - Last ${days} Days`);
  console.log('═'.repeat(70));
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  // 1. Get all trades in the period
  const { data: trades } = await supabase
    .from('trades')
    .select('*')
    .gte('executed_at', startDate.toISOString())
    .order('executed_at', { ascending: true });
  
  if (!trades || trades.length === 0) {
    console.log('\n❌ No trades found in this period');
    console.log('💡 The bot may not be running or market conditions haven\'t triggered any trades\n');
    return;
  }
  
  // 2. Get all signals generated
  const { data: signals } = await supabase
    .from('signal_history')
    .select('*')
    .gte('created_at', startDate.toISOString());
  
  // 3. Get execution logs
  const { data: executions } = await supabase
    .from('execution_log')
    .select('*')
    .gte('executed_at', startDate.toISOString())
    .order('executed_at', { ascending: true });
  
  // Calculate metrics
  const buyTrades = trades.filter(t => t.side === 'buy');
  const sellTrades = trades.filter(t => t.side === 'sell');
  
  console.log(`\n📈 TRADING ACTIVITY`);
  console.log('─'.repeat(70));
  console.log(`  Total Executions: ${executions?.length || 0}`);
  console.log(`  Market Open Executions: ${executions?.filter(e => e.market_open).length || 0}`);
  console.log(`  Total Signals Generated: ${signals?.length || 0}`);
  console.log(`  Buy Signals: ${signals?.filter(s => s.signal_type === 'BUY').length || 0}`);
  console.log(`  Sell Signals: ${signals?.filter(s => s.signal_type === 'SELL').length || 0}`);
  console.log(`  Hold Signals: ${signals?.filter(s => s.signal_type === 'HOLD').length || 0}`);
  console.log(`  Signals Executed: ${signals?.filter(s => s.was_executed).length || 0}`);
  console.log(`  Signal Execution Rate: ${((signals?.filter(s => s.was_executed).length || 0) / (signals?.length || 1) * 100).toFixed(1)}%`);
  
  console.log(`\n💰 TRADE SUMMARY`);
  console.log('─'.repeat(70));
  console.log(`  Buy Orders: ${buyTrades.length}`);
  console.log(`  Sell Orders: ${sellTrades.length}`);
  console.log(`  Total Capital Deployed: $${buyTrades.reduce((sum, t) => sum + parseFloat(t.total_value), 0).toFixed(2)}`);
  
  // Match buy/sell pairs to calculate P/L
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
        buyDate: buy.executed_at,
        sellDate: sell.executed_at,
        buyPrice: parseFloat(buy.price),
        sellPrice: parseFloat(sell.price),
        quantity: parseFloat(sell.quantity),
        profit,
        profitPercent,
        holdDays: Math.floor((new Date(sell.executed_at) - new Date(buy.executed_at)) / (1000 * 60 * 60 * 24)),
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
    
    console.log(`\n🎯 COMPLETED TRADES (${completedTrades.length})`);
    console.log('─'.repeat(70));
    console.log(`  Total P/L: ${totalProfit >= 0 ? '🟢' : '🔴'} $${totalProfit.toFixed(2)}`);
    console.log(`  Win Rate: ${winRate.toFixed(1)}% (${winners.length}W / ${losers.length}L)`);
    console.log(`  Avg Profit per Trade: $${(totalProfit / completedTrades.length).toFixed(2)}`);
    console.log(`  Avg Hold Time: ${(completedTrades.reduce((sum, t) => sum + t.holdDays, 0) / completedTrades.length).toFixed(1)} days`);
    
    if (winners.length > 0) {
      console.log(`  Avg Win: $${(winners.reduce((sum, t) => sum + t.profit, 0) / winners.length).toFixed(2)}`);
      console.log(`  Best Trade: $${Math.max(...winners.map(t => t.profit)).toFixed(2)}`);
    }
    
    if (losers.length > 0) {
      console.log(`  Avg Loss: $${(losers.reduce((sum, t) => sum + t.profit, 0) / losers.length).toFixed(2)}`);
      console.log(`  Worst Trade: $${Math.min(...losers.map(t => t.profit)).toFixed(2)}`);
    }
    
    console.log(`\n📋 TRADE DETAILS`);
    console.log('─'.repeat(70));
    completedTrades.forEach((trade, i) => {
      console.log(`\n  ${i + 1}. ${trade.ticker}`);
      console.log(`     Buy:  ${new Date(trade.buyDate).toLocaleDateString()} @ $${trade.buyPrice.toFixed(2)} (${trade.buyReason})`);
      console.log(`     Sell: ${new Date(trade.sellDate).toLocaleDateString()} @ $${trade.sellPrice.toFixed(2)} (${trade.sellReason})`);
      console.log(`     P/L:  ${trade.profit >= 0 ? '🟢' : '🔴'} $${trade.profit.toFixed(2)} (${trade.profitPercent >= 0 ? '+' : ''}${trade.profitPercent.toFixed(2)}%) - Held ${trade.holdDays} days`);
    });
  }
  
  // Analyze by ticker
  console.log(`\n📊 PERFORMANCE BY TICKER`);
  console.log('─'.repeat(70));
  
  const byTicker = {};
  completedTrades.forEach(trade => {
    if (!byTicker[trade.ticker]) {
      byTicker[trade.ticker] = { trades: [], profit: 0, wins: 0, losses: 0 };
    }
    byTicker[trade.ticker].trades.push(trade);
    byTicker[trade.ticker].profit += trade.profit;
    if (trade.profit > 0) byTicker[trade.ticker].wins++;
    else byTicker[trade.ticker].losses++;
  });
  
  Object.entries(byTicker).forEach(([ticker, data]) => {
    const winRate = (data.wins / data.trades.length) * 100;
    console.log(`  ${ticker}: ${data.profit >= 0 ? '🟢' : '🔴'} $${data.profit.toFixed(2)} | ${data.trades.length} trades | ${winRate.toFixed(0)}% win rate`);
  });
  
  console.log('\n');
}

const days = parseInt(process.argv[2]) || 7;
analyzePerformance(days).catch(console.error);

