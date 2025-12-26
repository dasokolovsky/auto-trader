/**
 * Backtest the trading strategy on historical data
 * Run with: node backtest.js
 */

const Alpaca = require('@alpacahq/alpaca-trade-api');

const alpaca = new Alpaca({
  keyId: process.env.ALPACA_API_KEY || 'PKTA522PH75BB2CDOWNZKN7S5P',
  secretKey: process.env.ALPACA_SECRET_KEY || 'FnG4zCdspPV9Hnxc8JHsFDLbK2qS7dopn4hu2F9tj6wB',
  paper: true,
  usePolygon: false,
  feed: 'iex', // Use free IEX data
});

// Strategy parameters
const STRATEGY = {
  rsi_oversold: 30,
  rsi_overbought: 70,
  dip_percentage: 5,
  profit_target_percent: 8,
  stop_loss_percent: 3,
  position_size_usd: 1000,
  max_positions: 5,
  lookback_days: 20,
};

// Calculate RSI
function calculateRSI(bars, period = 14) {
  if (bars.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = bars.length - period; i < bars.length; i++) {
    const change = bars[i].c - bars[i - 1].c;
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// Calculate percentage dip from recent high
function calculateDipPercentage(bars, lookbackDays) {
  const lookbackBars = bars.slice(-lookbackDays);
  const recentHigh = Math.max(...lookbackBars.map(b => b.c));
  const currentPrice = bars[bars.length - 1].c;
  return ((recentHigh - currentPrice) / recentHigh) * 100;
}

// Get historical data from Yahoo Finance (free, no API key needed)
async function getHistoricalData(ticker, days = 365) {
  const endDate = Math.floor(Date.now() / 1000);
  const startDate = endDate - (days * 24 * 60 * 60);

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${startDate}&period2=${endDate}&interval=1d`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.chart || !data.chart.result || !data.chart.result[0]) {
      console.log(`Failed to fetch data for ${ticker}`);
      return [];
    }

    const result = data.chart.result[0];
    const timestamps = result.timestamp;
    const quotes = result.indicators.quote[0];

    const barData = [];
    for (let i = 0; i < timestamps.length; i++) {
      barData.push({
        t: new Date(timestamps[i] * 1000).toISOString(),
        o: quotes.open[i],
        h: quotes.high[i],
        l: quotes.low[i],
        c: quotes.close[i],
        v: quotes.volume[i],
      });
    }

    return barData;
  } catch (error) {
    console.error(`Error fetching data for ${ticker}:`, error.message);
    return [];
  }
}

// Run backtest
async function backtest(ticker, days = 180) {
  console.log(`\n📊 Backtesting ${ticker} over last ${days} days...\n`);
  
  const bars = await getHistoricalData(ticker, days + 100); // Extra for RSI calculation
  
  if (bars.length < 100) {
    console.log('❌ Not enough historical data');
    return;
  }
  
  let cash = 100000; // Starting capital
  let position = null; // Current position
  let trades = [];
  
  // Start from day 100 to have enough data for indicators
  for (let i = 100; i < bars.length; i++) {
    const historicalBars = bars.slice(0, i + 1);
    const currentBar = bars[i];
    const currentPrice = currentBar.c;
    const date = new Date(currentBar.t).toISOString().split('T')[0];
    
    // Calculate indicators
    const rsi = calculateRSI(historicalBars);
    const dipPercent = calculateDipPercentage(historicalBars, STRATEGY.lookback_days);
    
    // Check SELL conditions if we have a position
    if (position) {
      const profitPercent = ((currentPrice - position.entry_price) / position.entry_price) * 100;
      
      let sellReason = null;
      if (rsi > STRATEGY.rsi_overbought) sellReason = 'RSI Overbought';
      else if (profitPercent >= STRATEGY.profit_target_percent) sellReason = 'Profit Target';
      else if (profitPercent <= -STRATEGY.stop_loss_percent) sellReason = 'Stop Loss';
      
      if (sellReason) {
        const profit = (currentPrice - position.entry_price) * position.quantity;
        cash += currentPrice * position.quantity;
        
        trades.push({
          date,
          action: 'SELL',
          price: currentPrice,
          quantity: position.quantity,
          profit,
          profitPercent,
          reason: sellReason,
          rsi,
        });
        
        position = null;
      }
    }
    
    // Check BUY conditions if we don't have a position
    if (!position && cash >= STRATEGY.position_size_usd) {
      const buySignal = rsi < STRATEGY.rsi_oversold && dipPercent >= STRATEGY.dip_percentage;
      
      if (buySignal) {
        const quantity = Math.floor(STRATEGY.position_size_usd / currentPrice);
        const cost = quantity * currentPrice;
        
        if (cost <= cash) {
          cash -= cost;
          position = {
            entry_price: currentPrice,
            quantity,
            entry_date: date,
          };
          
          trades.push({
            date,
            action: 'BUY',
            price: currentPrice,
            quantity,
            profit: 0,
            profitPercent: 0,
            reason: `RSI ${rsi.toFixed(1)}, Dip ${dipPercent.toFixed(1)}%`,
            rsi,
          });
        }
      }
    }
  }
  
  // Close any open position at the end
  if (position) {
    const finalPrice = bars[bars.length - 1].c;
    const profit = (finalPrice - position.entry_price) * position.quantity;
    cash += finalPrice * position.quantity;
    
    trades.push({
      date: new Date(bars[bars.length - 1].t).toISOString().split('T')[0],
      action: 'SELL',
      price: finalPrice,
      quantity: position.quantity,
      profit,
      profitPercent: ((finalPrice - position.entry_price) / position.entry_price) * 100,
      reason: 'End of backtest',
      rsi: calculateRSI(bars),
    });
  }
  
  return { trades, finalCash: cash, bars };
}

// Main execution
async function main() {
  const tickers = ['TSLA', 'AAPL', 'NVDA', 'MSFT'];
  const backtestDays = 365; // Last 1 year

  console.log('🔬 BACKTESTING AUTO TRADER STRATEGY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Strategy: RSI ${STRATEGY.rsi_oversold}/${STRATEGY.rsi_overbought}, ${STRATEGY.dip_percentage}% dip`);
  console.log(`Position Size: $${STRATEGY.position_size_usd}, Stop Loss: ${STRATEGY.stop_loss_percent}%, Target: ${STRATEGY.profit_target_percent}%`);
  console.log(`Period: Last ${backtestDays} days`);
  console.log('═══════════════════════════════════════════════════════════\n');

  let totalProfitAllStocks = 0;
  let totalTradesAllStocks = 0;
  let allWins = 0;
  let allLosses = 0;

  for (const ticker of tickers) {
    const result = await backtest(ticker, backtestDays);

    if (!result) continue;

    const { trades, finalCash, bars } = result;
    const buyTrades = trades.filter(t => t.action === 'BUY');
    const sellTrades = trades.filter(t => t.action === 'SELL');

    console.log(`\n📈 ${ticker} Results:`);
    console.log(`${'─'.repeat(50)}`);
    console.log(`  Total Trades: ${buyTrades.length} buys, ${sellTrades.length} sells`);

    if (sellTrades.length > 0) {
      const totalProfit = sellTrades.reduce((sum, t) => sum + t.profit, 0);
      const winningTrades = sellTrades.filter(t => t.profit > 0);
      const losingTrades = sellTrades.filter(t => t.profit < 0);
      const winRate = (winningTrades.length / sellTrades.length) * 100;

      totalProfitAllStocks += totalProfit;
      totalTradesAllStocks += sellTrades.length;
      allWins += winningTrades.length;
      allLosses += losingTrades.length;

      console.log(`  Total P/L: ${totalProfit >= 0 ? '🟢' : '🔴'} $${totalProfit.toFixed(2)}`);
      console.log(`  Win Rate: ${winRate.toFixed(1)}% (${winningTrades.length}W / ${losingTrades.length}L)`);
      if (winningTrades.length > 0) {
        console.log(`  Avg Win: $${(winningTrades.reduce((s, t) => s + t.profit, 0) / winningTrades.length).toFixed(2)}`);
      }
      if (losingTrades.length > 0) {
        console.log(`  Avg Loss: $${(losingTrades.reduce((s, t) => s + t.profit, 0) / losingTrades.length).toFixed(2)}`);
      }

      // Show individual trades
      console.log(`\n  Trade Details:`);
      sellTrades.forEach((trade, i) => {
        const buyTrade = buyTrades[i];
        if (buyTrade) {
          console.log(`    ${i + 1}. ${buyTrade.date} BUY @ $${buyTrade.price.toFixed(2)} → ${trade.date} SELL @ $${trade.price.toFixed(2)}`);
          console.log(`       P/L: ${trade.profit >= 0 ? '+' : ''}$${trade.profit.toFixed(2)} (${trade.profitPercent >= 0 ? '+' : ''}${trade.profitPercent.toFixed(2)}%) - ${trade.reason}`);
        }
      });
    } else {
      console.log(`  No completed trades`);
    }
  }

  // Overall summary
  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('📊 OVERALL SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Total Trades: ${totalTradesAllStocks}`);
  console.log(`Total P/L: ${totalProfitAllStocks >= 0 ? '🟢' : '🔴'} $${totalProfitAllStocks.toFixed(2)}`);
  if (totalTradesAllStocks > 0) {
    const overallWinRate = (allWins / totalTradesAllStocks) * 100;
    console.log(`Overall Win Rate: ${overallWinRate.toFixed(1)}% (${allWins}W / ${allLosses}L)`);
    console.log(`Avg P/L per trade: $${(totalProfitAllStocks / totalTradesAllStocks).toFixed(2)}`);
  }
  console.log('\n💡 Analysis:');
  if (totalTradesAllStocks < 10) {
    console.log('   ⚠️  Very few trades - strategy is too conservative');
    console.log('   💡 Consider relaxing RSI thresholds or dip percentage');
  }
  if (totalProfitAllStocks < 0) {
    console.log('   🔴 Strategy lost money - needs improvement');
  } else if (totalProfitAllStocks < 100) {
    console.log('   🟡 Small gains - strategy is marginally profitable');
  } else {
    console.log('   🟢 Strategy is profitable!');
  }
  console.log('\n');
}

main().catch(console.error);

