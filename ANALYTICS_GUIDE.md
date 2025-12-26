# 📊 Analytics & Performance Tracking Guide

## Overview

Your auto trader now has comprehensive analytics to track performance, analyze what's working, and make data-driven improvements.

## 🗄️ What Data is Collected

### 1. **Execution Log** (`execution_log` table)
Every time the cron job runs (every 15 minutes), it logs:
- Whether market was open
- Which tickers were analyzed
- What signals were generated
- How many trades were executed
- Portfolio value at that moment
- Execution time

### 2. **Signal History** (`signal_history` table)
Every signal generated (BUY/SELL/HOLD) is logged with:
- Ticker symbol
- Signal type
- RSI value
- Current price
- Dip percentage
- Reason for the signal
- Whether it was actually executed

### 3. **Portfolio Snapshots** (`portfolio_snapshots` table)
Daily snapshots of your portfolio:
- Portfolio value
- Cash balance
- Number of positions
- Daily return %
- Cumulative return %

### 4. **Trades** (enhanced `trades` table)
All executed trades with:
- Buy/Sell details
- Price and quantity
- Strategy parameters at time of trade
- RSI and reason for trade

## 📈 How to Use the Analytics

### **Day 1: Start the Bot**

1. Make sure the bot is running:
```bash
# Check bot status
curl http://localhost:3000/api/bot/status
```

2. The bot will automatically log every execution

### **Daily: Monitor Activity**

Check what's happening:
```bash
# See recent performance
node analyze-performance.js 1
```

### **After 1 Week: Generate Full Report**

```bash
# Comprehensive weekly analysis
node generate-weekly-report.js
```

This will show you:
- ✅ Total return for the week
- ✅ Number of trades executed
- ✅ Win rate and P/L
- ✅ Signal effectiveness
- ✅ Recommendations for improvement

### **Ongoing: Analyze Specific Periods**

```bash
# Last 3 days
node analyze-performance.js 3

# Last 30 days
node analyze-performance.js 30
```

## 🎯 What to Look For

### **Good Signs:**
- ✅ Win rate > 50%
- ✅ Positive total P/L
- ✅ Signal execution rate > 30%
- ✅ Consistent daily activity

### **Warning Signs:**
- ⚠️ No trades in a week → Strategy too conservative
- ⚠️ Win rate < 40% → Poor entry/exit timing
- ⚠️ Many signals but few executions → Check max_positions or capital
- ⚠️ High stop loss rate → Stop loss too tight

## 📊 Sample Weekly Report Output

```
═══════════════════════════════════════════════════════════
📊 AUTO TRADER - WEEKLY PERFORMANCE REPORT
═══════════════════════════════════════════════════════════

📈 EXECUTIVE SUMMARY
────────────────────────────────────────────────────────────
  Starting Portfolio Value: $100,000
  Ending Portfolio Value:   $100,250
  Weekly Return: 🟢 +0.25%
  Absolute P/L: 🟢 $250.00

📊 TRADING ACTIVITY
────────────────────────────────────────────────────────────
  Strategy Executions: 35
  Market Open Days: 5
  Total Signals: 42
  - Buy Signals: 8
  - Sell Signals: 3
  - Hold Signals: 31
  Trades Executed: 6
  - Buys: 3
  - Sells: 3

💰 TRADE PERFORMANCE
────────────────────────────────────────────────────────────
  Completed Trades: 3
  Win Rate: 66.7% (2W / 1L)
  Total P/L: 🟢 $250.00
  Avg P/L per Trade: $83.33
  Best Trade: +$150.00
  Worst Trade: $-50.00

💡 RECOMMENDATIONS
────────────────────────────────────────────────────────────
  ✅ Strategy is performing as expected
     Continue monitoring for another week before making changes
```

## 🔧 Customizing the Analysis

### Add Custom Metrics

Edit `analyze-performance.js` to add your own calculations:

```javascript
// Example: Calculate Sharpe ratio
const returns = completedTrades.map(t => t.profitPercent);
const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
const stdDev = Math.sqrt(returns.reduce((sq, n) => sq + Math.pow(n - avgReturn, 2), 0) / returns.length);
const sharpeRatio = avgReturn / stdDev;
```

### Export to CSV

Add this to any analysis script:

```javascript
const fs = require('fs');
const csv = completedTrades.map(t => 
  `${t.ticker},${t.buyDate},${t.sellDate},${t.profit}`
).join('\n');
fs.writeFileSync('trades.csv', 'Ticker,Buy Date,Sell Date,Profit\n' + csv);
```

## 🚀 Next Steps

1. **Run for 1 week** - Let the bot collect data
2. **Generate weekly report** - See what's working
3. **Analyze patterns** - Which tickers perform best? What RSI levels work?
4. **Iterate** - Adjust strategy parameters based on data
5. **Repeat** - Test new parameters for another week

## 📅 Recommended Schedule

- **Every 15 min**: Bot runs automatically (logs everything)
- **Daily**: Quick check with `node analyze-performance.js 1`
- **Weekly**: Full report with `node generate-weekly-report.js`
- **Monthly**: Deep dive and strategy adjustments

## 💾 Database Queries

You can also query the database directly:

```sql
-- See all signals from today
SELECT * FROM signal_history 
WHERE created_at >= CURRENT_DATE 
ORDER BY created_at DESC;

-- Win rate by ticker
SELECT 
  ticker,
  COUNT(*) as trades,
  SUM(CASE WHEN profit > 0 THEN 1 ELSE 0 END) as wins
FROM (
  -- Your trade matching logic here
) GROUP BY ticker;

-- Average execution time
SELECT AVG(execution_time_ms) as avg_ms 
FROM execution_log 
WHERE executed_at >= NOW() - INTERVAL '7 days';
```

## 🎓 Learning from the Data

The analytics will help you answer:
- **Which stocks work best with this strategy?**
- **What RSI levels actually lead to profitable trades?**
- **Is the 5% dip requirement too strict?**
- **Are stop losses triggering too early?**
- **What time of day generates the best signals?**

Use this data to continuously improve your strategy! 🚀

