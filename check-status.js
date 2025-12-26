/**
 * Quick status check - see what's happening right now
 * Run: node check-status.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jtcyaetmjdgosmgycwwh.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkStatus() {
  console.log('\n🤖 AUTO TRADER STATUS CHECK');
  console.log('═'.repeat(60));
  console.log(`Time: ${new Date().toLocaleString()}\n`);
  
  // 1. Bot Status
  const { data: botStatus } = await supabase
    .from('bot_status')
    .select('*')
    .single();
  
  console.log('🔧 BOT STATUS');
  console.log('─'.repeat(60));
  console.log(`  Running: ${botStatus?.is_running ? '🟢 YES' : '🔴 NO'}`);
  console.log(`  Last Run: ${botStatus?.last_run_at ? new Date(botStatus.last_run_at).toLocaleString() : 'Never'}`);
  console.log(`  Last Error: ${botStatus?.last_error || 'None'}`);
  
  // 2. Active Strategy
  const { data: strategy } = await supabase
    .from('strategy_config')
    .select('*')
    .eq('is_active', true)
    .single();
  
  console.log(`\n📊 ACTIVE STRATEGY`);
  console.log('─'.repeat(60));
  if (strategy) {
    console.log(`  Name: ${strategy.name}`);
    console.log(`  RSI Oversold: ${strategy.params.rsi_oversold}`);
    console.log(`  RSI Overbought: ${strategy.params.rsi_overbought}`);
    console.log(`  Dip %: ${strategy.params.dip_percentage}%`);
    console.log(`  Stop Loss: ${strategy.params.stop_loss_percentage}%`);
    console.log(`  Take Profit: ${strategy.params.take_profit_percentage}%`);
    console.log(`  Position Size: $${strategy.params.position_size_usd}`);
    console.log(`  Max Positions: ${strategy.params.max_positions}`);
  } else {
    console.log('  ⚠️  No active strategy');
  }
  
  // 3. Watchlist
  const { data: watchlist } = await supabase
    .from('watchlist')
    .select('*')
    .eq('is_active', true);
  
  console.log(`\n👀 WATCHLIST`);
  console.log('─'.repeat(60));
  if (watchlist && watchlist.length > 0) {
    console.log(`  Tickers: ${watchlist.map(w => w.ticker).join(', ')}`);
  } else {
    console.log('  ⚠️  No tickers in watchlist');
  }
  
  // 4. Recent Activity (last 24 hours)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const { data: recentTrades } = await supabase
    .from('trades')
    .select('*')
    .gte('executed_at', yesterday.toISOString())
    .order('executed_at', { ascending: false });
  
  const { data: recentSignals } = await supabase
    .from('signal_history')
    .select('*')
    .gte('created_at', yesterday.toISOString());
  
  const { data: recentExecutions } = await supabase
    .from('execution_log')
    .select('*')
    .gte('executed_at', yesterday.toISOString())
    .order('executed_at', { ascending: false })
    .limit(1);
  
  console.log(`\n📈 LAST 24 HOURS`);
  console.log('─'.repeat(60));
  console.log(`  Strategy Runs: ${recentExecutions?.length || 0}`);
  console.log(`  Signals Generated: ${recentSignals?.length || 0}`);
  console.log(`  Trades Executed: ${recentTrades?.length || 0}`);
  
  if (recentTrades && recentTrades.length > 0) {
    console.log(`\n  Recent Trades:`);
    recentTrades.slice(0, 5).forEach(trade => {
      const time = new Date(trade.executed_at).toLocaleTimeString();
      console.log(`    ${time} - ${trade.side.toUpperCase()} ${trade.ticker} x${trade.quantity} @ $${parseFloat(trade.price).toFixed(2)}`);
    });
  }
  
  // 5. Current Portfolio (if available)
  const { data: latestSnapshot } = await supabase
    .from('portfolio_snapshots')
    .select('*')
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .single();
  
  if (latestSnapshot) {
    console.log(`\n💰 LATEST PORTFOLIO SNAPSHOT`);
    console.log('─'.repeat(60));
    console.log(`  Date: ${latestSnapshot.snapshot_date}`);
    console.log(`  Portfolio Value: $${parseFloat(latestSnapshot.portfolio_value).toLocaleString()}`);
    console.log(`  Cash: $${parseFloat(latestSnapshot.cash_balance).toLocaleString()}`);
    console.log(`  Positions: ${latestSnapshot.total_positions}`);
    if (latestSnapshot.daily_return_percent) {
      const dailyReturn = parseFloat(latestSnapshot.daily_return_percent);
      console.log(`  Daily Return: ${dailyReturn >= 0 ? '🟢' : '🔴'} ${dailyReturn >= 0 ? '+' : ''}${dailyReturn.toFixed(2)}%`);
    }
    if (latestSnapshot.cumulative_return_percent) {
      const cumReturn = parseFloat(latestSnapshot.cumulative_return_percent);
      console.log(`  Total Return: ${cumReturn >= 0 ? '🟢' : '🔴'} ${cumReturn >= 0 ? '+' : ''}${cumReturn.toFixed(2)}%`);
    }
  }
  
  // 6. Next Steps
  console.log(`\n💡 NEXT STEPS`);
  console.log('─'.repeat(60));
  
  if (!botStatus?.is_running) {
    console.log('  ⚠️  Bot is not running - start it in the dashboard');
  } else if (!watchlist || watchlist.length === 0) {
    console.log('  ⚠️  Add tickers to watchlist in the dashboard');
  } else if (!recentTrades || recentTrades.length === 0) {
    console.log('  ✅ Bot is running, waiting for trading opportunities');
    console.log('  💡 Check back during market hours (9:30 AM - 4 PM ET)');
  } else {
    console.log('  ✅ Everything looks good!');
    console.log('  💡 Run: node analyze-performance.js 7');
  }
  
  console.log('\n' + '═'.repeat(60) + '\n');
}

checkStatus().catch(console.error);

