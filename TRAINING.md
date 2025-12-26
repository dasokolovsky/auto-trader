# 🎓 Training the Intelligent Trading System

## Overview

Instead of letting your bot learn from scratch (and potentially lose money), you can **pre-train** it with historical data. The system will backtest your strategy on 90 days of past data and learn which tickers work best.

---

## 🧠 How Training Works

### **Without Training (Learning from Scratch)**
```
Day 1: Add NVDA to watchlist
      → System: "Unproven, let's try it"
      → BUY signal → Buys
      
Day 2: Loses $50
      → System: "Hmm, not great"
      
Day 3: Loses $30
      → System: "This is bad"
      
Day 7: After 5 losses, finally removes NVDA
      → Total loss: $200
```

### **With Training (Pre-trained)**
```
Before Day 1: Backtest NVDA on 90 days of history
              → Result: Score 25, Win Rate 30%
              → System: "This ticker is a poor performer"
              
Day 1: Add NVDA to watchlist
      → BUY signal generated
      → System: "Wait, NVDA has Score 25 from backtest"
      → System: "Skipping this trade"
      → Saved $200!
```

---

## 🚀 Quick Start

### **Step 1: Apply Database Migration**

First, add the `is_simulated` column to track backtest data:

```bash
# Go to Supabase Dashboard
# SQL Editor → New Query → Paste this:
```

```sql
ALTER TABLE trades ADD COLUMN IF NOT EXISTS is_simulated BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_trades_is_simulated ON trades(is_simulated);
```

Click **Run** to execute.

### **Step 2: Start Dev Server**

The training script calls API endpoints, so the server must be running:

```bash
npm run dev
```

Keep this running in one terminal.

### **Step 3: Run Training (New Terminal)**

Open a **new terminal** and run:

```bash
node train-system.js
```

This will:
1. Backtest 17 popular tickers on 90 days of data
2. Save results to database
3. Show you which tickers are best

**Expected output:**
```
═══════════════════════════════════════════════════════════
🎓 TRAINING INTELLIGENT TRADING SYSTEM
═══════════════════════════════════════════════════════════
Tickers: AAPL, MSFT, GOOGL, META, NVDA, AMD, TSLA, ...
Lookback: 90 days

────────────────────────────────────────────────────────────
📊 Backtesting AAPL...

✅ AAPL Backtest Complete:
   Total Trades: 24
   Completed: 12 (8W/4L)
   Win Rate: 66.7%
   Total P/L: $450.00
   Avg P/L: $37.50
   Score: 72/100
   Status: 🟢 EXCELLENT

────────────────────────────────────────────────────────────
📊 Backtesting NVDA...

✅ NVDA Backtest Complete:
   Total Trades: 18
   Completed: 9 (7W/2L)
   Win Rate: 77.8%
   Total P/L: $520.00
   Avg P/L: $57.78
   Score: 85/100
   Status: 🟢 EXCELLENT

... (continues for all tickers)

═══════════════════════════════════════════════════════════
📊 TRAINING SUMMARY
═══════════════════════════════════════════════════════════

Rank | Ticker | Score | Win Rate | Total P/L | Avg P/L | Status
────────────────────────────────────────────────────────────
🥇   | NVDA   | 🟢 85 |  77.8%   | $ 520.00  | $57.78  | EXCELLENT
🥈   | AAPL   | 🟢 72 |  66.7%   | $ 450.00  | $37.50  | EXCELLENT
🥉   | MSFT   | 🟢 70 |  65.0%   | $ 380.00  | $31.67  | EXCELLENT
4.   | TSLA   | 🟡 55 |  55.0%   | $ 220.00  | $18.33  | GOOD
5.   | AMD    | 🟠 28 |  30.0%   | $-150.00  | $-12.50 | POOR

💡 RECOMMENDATIONS
────────────────────────────────────────────────────────────

✅ ADD THESE TO WATCHLIST (Score ≥ 70):
   NVDA: Score 85 | Win Rate 77.8% | Total P/L $520.00
   AAPL: Score 72 | Win Rate 66.7% | Total P/L $450.00
   MSFT: Score 70 | Win Rate 65.0% | Total P/L $380.00

🟡 CONSIDER THESE (Score 40-69):
   TSLA: Score 55 | Win Rate 55.0%

⚠️  AVOID THESE (Score < 40):
   AMD: Score 28 | Win Rate 30.0%

═══════════════════════════════════════════════════════════
✅ Training complete! The system now has historical knowledge.
💡 Add the top performers to your watchlist to start trading.
═══════════════════════════════════════════════════════════
```

---

## 🎯 Custom Training

### **Train Specific Tickers**

```bash
node train-system.js --tickers=AAPL,NVDA,TSLA,AMZN
```

### **Change Lookback Period**

```bash
# Train on 180 days (6 months)
node train-system.js --days=180

# Train on 30 days (1 month)
node train-system.js --days=30
```

### **Combine Options**

```bash
node train-system.js --tickers=AAPL,NVDA --days=180
```

---

## 📊 What Happens During Training

### **1. Fetch Historical Data**
```
Fetching 90 days of price data for AAPL...
├─ Day 1: Open $150, Close $152
├─ Day 2: Open $152, Close $148
├─ Day 3: Open $148, Close $155
└─ ... (90 days total)
```

### **2. Simulate Trading**
```
Day 20: RSI = 28 (oversold), Dip = 6%
       → BUY signal → Simulated BUY 6 shares @ $150

Day 25: RSI = 72 (overbought)
       → SELL signal → Simulated SELL 6 shares @ $162
       → Profit: $72

Day 30: RSI = 29 (oversold), Dip = 5%
       → BUY signal → Simulated BUY 6 shares @ $155

... (continues through all 90 days)
```

### **3. Calculate Performance**
```
Total Trades: 24 (12 buy, 12 sell)
Wins: 8
Losses: 4
Win Rate: 66.7%
Total P/L: $450
Avg P/L: $37.50
Score: 72/100
Status: EXCELLENT
```

### **4. Save to Database**
```
Saving 24 simulated trades to database...
✓ All trades marked with is_simulated = true
```

---

## 🧠 How the System Uses Training Data

### **Before First Real Trade**

When the bot encounters a BUY signal:

```
Signal: BUY NVDA @ $450
↓
System checks database:
├─ Found 18 simulated trades for NVDA
├─ Score: 85, Win Rate: 77.8%
└─ Status: EXCELLENT
↓
Decision: ✅ BUY - "Excellent performer based on backtest"
```

```
Signal: BUY AMD @ $120
↓
System checks database:
├─ Found 16 simulated trades for AMD
├─ Score: 28, Win Rate: 30.0%
└─ Status: POOR
↓
Decision: ❌ SKIP - "Poor performer based on backtest"
```

### **As Real Trades Accumulate**

The system combines backtest data with real trades:

```
Week 1: NVDA has 9 simulated trades (from backtest)
       → Score: 85 (based on backtest)

Week 2: NVDA has 9 simulated + 2 real trades
       → Score: 83 (weighted average)

Week 4: NVDA has 9 simulated + 8 real trades
       → Score: 80 (real data has more weight)

Week 8: NVDA has 9 simulated + 20 real trades
       → Score: 78 (mostly based on real data now)
```

---

## 💡 Best Practices

### **1. Train Before Going Live**

```bash
# Day 0: Train the system
node train-system.js

# Day 1: Add top performers to watchlist
# (Use the recommendations from training output)

# Day 2: Start the bot
# It will skip poor performers from day 1!
```

### **2. Re-train Periodically**

Market conditions change. Re-train monthly:

```bash
# First Monday of each month
node train-system.js --days=90
```

### **3. Train on Different Timeframes**

```bash
# Short-term (1 month)
node train-system.js --days=30

# Medium-term (3 months)
node train-system.js --days=90

# Long-term (6 months)
node train-system.js --days=180
```

Compare results to see which timeframe works best for your strategy.

### **4. Test New Tickers Before Adding**

Before adding a new ticker to your watchlist:

```bash
node train-system.js --tickers=NEWSTOCK --days=90
```

If Score < 40, don't add it!

---

## 🔍 Viewing Training Results

### **Web Dashboard**

```
http://localhost:3000 → Analytics → Intelligent Watchlist Management
```

You'll see scores based on both backtest and real data.

### **API Endpoint**

```bash
curl http://localhost:3000/api/backtest/run?ticker=AAPL
```

Returns backtest results for AAPL.

---

## ⚠️ Important Notes

### **1. Backtest Data is Marked**

All training trades have `is_simulated = true` in the database. This ensures:
- You can distinguish backtest from real trades
- You can clear backtest data without affecting real trades
- Analytics can show both separately

### **2. Past Performance ≠ Future Results**

Backtesting shows how the strategy **would have** performed. It doesn't guarantee future success. Use it as a guide, not a guarantee.

### **3. Training Takes Time**

Backtesting 17 tickers on 90 days takes ~2-3 minutes due to:
- API rate limits
- Data processing
- Database writes

Be patient!

---

## 🧹 Clearing Training Data

If you want to re-train from scratch:

```sql
-- In Supabase SQL Editor
DELETE FROM trades WHERE is_simulated = true;
```

Then run training again.

---

## ✅ Summary

**Before Training:**
- Bot learns from scratch
- Makes mistakes on bad tickers
- Loses money while learning

**After Training:**
- Bot starts with 90 days of knowledge
- Skips bad tickers from day 1
- Focuses on proven winners

**Result:** Your bot is smart from day 1! 🎓

---

## 🚀 Next Steps

1. ✅ Run `node train-system.js`
2. ✅ Add top performers (Score ≥ 70) to watchlist
3. ✅ Start the bot
4. ✅ Watch it skip poor performers automatically!

