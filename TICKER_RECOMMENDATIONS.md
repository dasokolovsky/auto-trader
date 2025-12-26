# 🎯 Intelligent Ticker Recommendation System

## Overview

Your auto trader now has an **AI-powered ticker recommendation system** that analyzes which stocks work best with your strategy and suggests new ones to add.

## 🧠 How It Works

### **Scoring Algorithm**

Each ticker gets a score from 0-100 based on:

1. **Win Rate (40%)** - What % of trades are profitable?
2. **Profit per Trade (30%)** - Average profit/loss per completed trade
3. **Signal Execution Rate (20%)** - How often signals turn into actual trades
4. **Trade Volume (10%)** - More data = more confidence

### **Score Interpretation**

- **70-100** 🟢 **Excellent** - Keep these tickers, they work great!
- **40-69** 🟡 **Good** - Decent performance, monitor them
- **0-39** 🔴 **Poor** - Consider removing from watchlist

---

## 📊 Two Types of Analysis

### 1. **Current Performance** (What's Working Now)

Analyzes tickers **already in your watchlist** based on historical data.

**Shows:**
- Ranked list of your current tickers
- Win rate and profit for each
- Which ones to keep vs remove

### 2. **New Recommendations** (What to Add)

Scans **50+ popular stocks** to find the best opportunities right now.

**Analyzes:**
- Current RSI levels
- Recent price dips
- Historical winners
- Market conditions

**Recommends:**
- **Strong Buy** - Add immediately (Score ≥ 60)
- **Consider** - Good potential (Score 40-59)
- **Watch** - Monitor for now (Score < 40)

---

## 🌐 Using the Web Dashboard

### **Step 1: Go to Analytics Tab**

```
http://localhost:3000 → Click "Analytics" tab
```

### **Step 2: View Ticker Performance**

You'll see two sub-tabs:

#### **📊 Current Performance**
- Shows all tickers you've traded
- Ranked by score (best to worst)
- Top 3 highlighted in green 🥇🥈🥉

**Example:**
```
Rank | Ticker | Score | Win Rate | Profit/Trade | Total P/L
🥇   | NVDA   | 85    | 75.0%    | $12.50       | $150.00
🥈   | AAPL   | 72    | 66.7%    | $8.30        | $100.00
🥉   | TSLA   | 68    | 60.0%    | $5.20        | $52.00
4    | MSFT   | 45    | 50.0%    | $2.10        | $21.00
5    | AMD    | 28    | 33.3%    | -$3.50       | -$35.00
```

**Action:** Remove AMD (score < 30), keep NVDA and AAPL (score > 70)

#### **🎯 Recommendations**
- Shows new tickers to consider adding
- Sorted by score (best opportunities first)
- One-click "Add to Watchlist" button

**Example:**
```
NVDA - Strong Buy (Score: 85) 🏆 Past Winner
└─ RSI oversold at 28, dipped 6.2% - Strong buy signal
   [Add to Watchlist]

META - Consider (Score: 55)
└─ RSI at 32, dipped 4.1% - Potential opportunity
   [Add to Watchlist]
```

### **Step 3: Add Recommended Tickers**

Click **"Add to Watchlist"** button next to any ticker you want to add.

---

## 🖥️ Using the Terminal

### **Analyze Current Tickers**

```bash
node recommend-tickers.js
```

**Output:**
```
═══════════════════════════════════════════════════════════
🎯 TICKER PERFORMANCE ANALYSIS & RECOMMENDATIONS
═══════════════════════════════════════════════════════════

📊 TICKER PERFORMANCE RANKING (Last 30 Days)
────────────────────────────────────────────────────────────
Rank | Ticker | Score | Win Rate | Avg P/L | Total P/L | Trades
🥇   | NVDA   | 🟢 85 |  75.0%   | 🟢 $12.50 | $150.00  |     12
🥈   | AAPL   | 🟢 72 |  66.7%   | 🟢  $8.30 | $100.00  |     12
🥉   | TSLA   | 🟡 68 |  60.0%   | 🟢  $5.20 |  $52.00  |     10
4.   | MSFT   | 🟡 45 |  50.0%   | 🟢  $2.10 |  $21.00  |     10
5.   | AMD    | 🔴 28 |  33.3%   | 🔴 -$3.50 | -$35.00  |     10

💡 RECOMMENDATIONS
────────────────────────────────────────────────────────────

✅ KEEP THESE (Score ≥ 70):
   NVDA: Score 85 | Win Rate 75.0% | Total P/L $150.00
   AAPL: Score 72 | Win Rate 66.7% | Total P/L $100.00

⚠️  CONSIDER REMOVING (Score < 30):
   AMD: Score 28 | Win Rate 33.3% | Total P/L $-35.00

📊 MONITOR THESE (Score 30-70):
   TSLA: Score 68 | Give it more time to prove itself
   MSFT: Score 45 | Give it more time to prove itself
```

---

## 🎯 Recommendation Strategy

### **Week 1: Start with Popular Stocks**

Add 5-10 well-known, liquid stocks:
- Tech: AAPL, MSFT, NVDA, TSLA
- Finance: JPM, BAC
- Consumer: AMZN, WMT

### **Week 2: Analyze Performance**

```bash
node recommend-tickers.js
```

Identify:
- ✅ Winners (Score ≥ 70) - Keep these
- ⚠️ Losers (Score < 30) - Remove these
- 📊 Neutral (30-70) - Give more time

### **Week 3: Optimize Watchlist**

1. Remove poor performers (Score < 30)
2. Keep top performers (Score ≥ 70)
3. Add new recommendations from the system

### **Week 4: Refine**

- Focus on 5-7 best-performing tickers
- Add 2-3 new ones to test
- Repeat the cycle

---

## 📈 Advanced: Understanding the Ticker Universe

The system scans **50+ stocks** across sectors:

### **Tech** (10 stocks)
AAPL, MSFT, GOOGL, META, NVDA, AMD, INTC, TSLA, NFLX, ADBE

### **Finance** (6 stocks)
JPM, BAC, WFC, GS, MS, C

### **Healthcare** (6 stocks)
JNJ, UNH, PFE, ABBV, MRK, TMO

### **Consumer** (6 stocks)
AMZN, WMT, HD, NKE, SBUX, MCD

### **Energy** (4 stocks)
XOM, CVX, COP, SLB

### **Industrial** (4 stocks)
BA, CAT, GE, UPS

**Why these?**
- High liquidity (easy to buy/sell)
- Well-known companies
- Good for swing trading
- Diverse sectors

---

## 🔧 Customizing the Ticker Universe

Want to add your own stocks? Edit the file:

`app/api/analytics/recommend-tickers/route.ts`

```typescript
const TICKER_UNIVERSE = [
  // Add your custom tickers here
  'YOUR_TICKER_1',
  'YOUR_TICKER_2',
  // ... existing tickers
]
```

---

## 💡 Pro Tips

### **1. Start Small**
- Begin with 5 tickers
- Let them run for 2 weeks
- Analyze before adding more

### **2. Diversify Sectors**
- Don't put all tickers in one sector (e.g., all tech)
- Mix tech, finance, consumer, etc.
- Reduces risk if one sector crashes

### **3. Trust the Data**
- If a ticker has Score < 30 after 20+ trades, remove it
- Don't hold onto losers hoping they'll improve
- Focus capital on proven winners

### **4. Regular Cleanup**
- Run `node recommend-tickers.js` weekly
- Remove bottom 20% performers
- Add new recommendations

### **5. Watch for Patterns**
- Do certain sectors perform better?
- Do high-volatility stocks work better?
- Adjust your universe based on findings

---

## 🎓 Example Workflow

### **Monday Morning:**
```bash
# Check recommendations
node recommend-tickers.js

# See what's hot today
# Go to dashboard → Analytics → Recommendations
```

### **Action:**
- Remove any ticker with Score < 30
- Add 1-2 "Strong Buy" recommendations
- Keep watchlist at 5-7 tickers

### **Friday Evening:**
```bash
# Weekly review
node generate-weekly-report.js
node recommend-tickers.js
```

### **Action:**
- Analyze which tickers performed best
- Plan next week's watchlist
- Make ONE change at a time

---

## ✅ Summary

You now have **intelligent ticker selection** that:

1. ✅ **Ranks your current tickers** by performance
2. ✅ **Recommends new tickers** based on market conditions
3. ✅ **Scores everything 0-100** for easy decisions
4. ✅ **Available in web dashboard** and terminal
5. ✅ **Updates in real-time** as you trade

**Result:** You'll always know which stocks to trade and which to avoid! 🎯

