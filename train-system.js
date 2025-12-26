/**
 * Pre-train the intelligent trading system with historical data
 * Run: node train-system.js [--tickers AAPL,NVDA,TSLA] [--days 90]
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jtcyaetmjdgosmgycwwh.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Parse command line arguments
const args = process.argv.slice(2);
const tickersArg = args.find(arg => arg.startsWith('--tickers='));
const daysArg = args.find(arg => arg.startsWith('--days='));

const TICKERS = tickersArg 
  ? tickersArg.split('=')[1].split(',')
  : [
      // Tech
      'AAPL', 'MSFT', 'GOOGL', 'META', 'NVDA', 'AMD', 'TSLA',
      // Finance
      'JPM', 'BAC', 'WFC',
      // Consumer
      'AMZN', 'WMT', 'HD',
      // Healthcare
      'JNJ', 'UNH',
      // Energy
      'XOM', 'CVX'
    ];

const DAYS = daysArg ? parseInt(daysArg.split('=')[1]) : 90;

console.log('\n' + '═'.repeat(80));
console.log('🎓 TRAINING INTELLIGENT TRADING SYSTEM');
console.log('═'.repeat(80));
console.log(`Tickers: ${TICKERS.join(', ')}`);
console.log(`Lookback: ${DAYS} days`);
console.log(`Started: ${new Date().toLocaleString()}\n`);

async function trainSystem() {
  const results = [];
  
  for (const ticker of TICKERS) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`📊 Backtesting ${ticker}...`);
    
    try {
      // Call the backtest API endpoint
      const response = await fetch(`http://localhost:3000/api/backtest/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, days: DAYS })
      });
      
      if (!response.ok) {
        console.error(`❌ Failed to backtest ${ticker}: ${response.statusText}`);
        continue;
      }
      
      const result = await response.json();
      results.push(result);
      
      // Display results
      console.log(`\n✅ ${ticker} Backtest Complete:`);
      console.log(`   Total Trades: ${result.totalTrades}`);
      console.log(`   Completed: ${result.wins + result.losses} (${result.wins}W/${result.losses}L)`);
      console.log(`   Win Rate: ${result.winRate.toFixed(1)}%`);
      console.log(`   Total P/L: $${result.totalProfit.toFixed(2)}`);
      console.log(`   Avg P/L: $${result.avgProfit.toFixed(2)}`);
      console.log(`   Score: ${result.score.toFixed(0)}/100`);
      
      const status = result.score >= 70 ? '🟢 EXCELLENT' : 
                     result.score >= 40 ? '🟡 GOOD' : 
                     result.score >= 20 ? '🟠 POOR' : '🔴 CRITICAL';
      console.log(`   Status: ${status}`);
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Error backtesting ${ticker}:`, error.message);
    }
  }
  
  // Summary
  console.log('\n' + '═'.repeat(80));
  console.log('📊 TRAINING SUMMARY');
  console.log('═'.repeat(80));
  
  if (results.length === 0) {
    console.log('⚠️  No results. Make sure the dev server is running: npm run dev\n');
    return;
  }
  
  // Sort by score
  results.sort((a, b) => b.score - a.score);
  
  console.log('\nRank | Ticker | Score | Win Rate | Total P/L | Avg P/L | Status');
  console.log('─'.repeat(80));
  
  results.forEach((result, index) => {
    const rank = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
    const scoreColor = result.score >= 70 ? '🟢' : 
                       result.score >= 40 ? '🟡' : 
                       result.score >= 20 ? '🟠' : '🔴';
    const status = result.score >= 70 ? 'EXCELLENT' : 
                   result.score >= 40 ? 'GOOD' : 
                   result.score >= 20 ? 'POOR' : 'CRITICAL';
    
    console.log(
      `${rank.padEnd(5)} | ${result.ticker.padEnd(6)} | ${scoreColor} ${result.score.toFixed(0).padStart(3)} | ` +
      `${result.winRate.toFixed(1).padStart(5)}% | ` +
      `$${result.totalProfit.toFixed(2).padStart(8)} | ` +
      `$${result.avgProfit.toFixed(2).padStart(6)} | ${status}`
    );
  });
  
  // Recommendations
  const excellent = results.filter(r => r.score >= 70);
  const good = results.filter(r => r.score >= 40 && r.score < 70);
  const poor = results.filter(r => r.score < 40);
  
  console.log('\n💡 RECOMMENDATIONS');
  console.log('─'.repeat(80));
  
  if (excellent.length > 0) {
    console.log(`\n✅ ADD THESE TO WATCHLIST (Score ≥ 70):`);
    excellent.forEach(r => {
      console.log(`   ${r.ticker}: Score ${r.score.toFixed(0)} | Win Rate ${r.winRate.toFixed(1)}% | Total P/L $${r.totalProfit.toFixed(2)}`);
    });
  }
  
  if (good.length > 0) {
    console.log(`\n🟡 CONSIDER THESE (Score 40-69):`);
    good.forEach(r => {
      console.log(`   ${r.ticker}: Score ${r.score.toFixed(0)} | Win Rate ${r.winRate.toFixed(1)}%`);
    });
  }
  
  if (poor.length > 0) {
    console.log(`\n⚠️  AVOID THESE (Score < 40):`);
    poor.forEach(r => {
      console.log(`   ${r.ticker}: Score ${r.score.toFixed(0)} | Win Rate ${r.winRate.toFixed(1)}%`);
    });
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log('✅ Training complete! The system now has historical knowledge.');
  console.log('💡 Add the top performers to your watchlist to start trading.');
  console.log('═'.repeat(80) + '\n');
}

trainSystem().catch(console.error);

