# 🧠 Intelligent Trading System

## Overview

Your auto trader now has **AI-powered decision making** that learns from past performance and automatically manages your watchlist. It's like having a smart assistant that:

- ✅ **Evaluates before buying** - "Is this ticker still worth trading?"
- ✅ **Cuts losses early** - "This ticker is underperforming, sell and remove it"
- ✅ **Auto-manages watchlist** - "Remove losers, keep winners"

---

## 🎯 How It Works

### **Three Intelligent Decisions**

#### **1. Before Buying** 🤔
Every time the strategy generates a BUY signal, the system asks:

```
"Should I actually buy this ticker?"
```

**Decision Logic:**
- **Unproven** (< 3 trades) → ✅ **BUY** - Give it a chance
- **Excellent** (Score ≥ 70) → ✅ **BUY** - Proven winner!
- **Good** (Score 30-69) → ✅ **BUY** - Decent performer
- **Poor** (Score < 30) → ❌ **SKIP** - Don't waste money

**Example:**
```
Signal: BUY NVDA at $450
Analysis: Score 85, Win Rate 75%, Total P/L $150
Decision: ✅ BUY - Excellent performer
```

```
Signal: BUY AMD at $120
Analysis: Score 25, Win Rate 30%, Total P/L -$50
Decision: ❌ SKIP - Poor performer, not worth it
```

#### **2. After Selling** 📊
After selling a position, the system asks:

```
"Should I remove this ticker from the watchlist?"
```

**Decision Logic:**
- Score < 20 → 🗑️ **REMOVE** - Critically poor
- Win Rate < 25% (after 5+ trades) → 🗑️ **REMOVE** - Consistent loser
- Otherwise → ✅ **KEEP** - Give it more time

**Example:**
```
Sold AMD: Total P/L -$75, Win Rate 20%, Score 18
Decision: 🗑️ REMOVE from watchlist - Consistent loser
```

#### **3. Periodic Cleanup** 🧹
Every time the cron job runs, it automatically:

```
"Are there any tickers I should remove?"
```

**Removes tickers that:**
- Have Score < 20
- Have Win Rate < 25% after 5+ trades
- Are consistently losing money

---

## 🌐 Using the Web Dashboard

### **Step 1: Go to Analytics Tab**

```
http://localhost:3000 → Click "Analytics" tab
```

### **Step 2: View Intelligent Decisions**

You'll see a new section at the top:

#### **Intelligent Watchlist Management**

```
┌─────────────────────────────────────────────────┐
│ Intelligent Watchlist Management                │
│ AI-powered decisions on what to keep and remove │
│                                                  │
│  Total Tickers: 10  |  Keep: 7  |  Remove: 3   │
│                                    [Remove 3 Tickers] │
└─────────────────────────────────────────────────┘
```

#### **⚠️ Recommended for Removal**

```
AMD - Score: 18 - POOR
└─ Critically poor performance (Score: 18, Win Rate: 20%, Total P/L: $-75.00)
   Win Rate: 20.0% | Total P/L: $-75.00 | Trades: 10
   🗑️

INTC - Score: 22 - POOR
└─ Consistent loser (2W/8L, Win Rate: 20.0%)
   Win Rate: 20.0% | Total P/L: $-45.00 | Trades: 10
   🗑️
```

#### **✅ Keep These Tickers**

```
NVDA - Score: 85 - EXCELLENT
└─ Performance acceptable
   Win Rate: 75.0% | Total P/L: $150.00 | Trades: 12
   🏆

AAPL - Score: 72 - EXCELLENT
└─ Performance acceptable
   Win Rate: 66.7% | Total P/L: $100.00 | Trades: 12
   ✅
```

### **Step 3: Execute Cleanup**

Click **"Remove 3 Tickers"** button to remove poor performers.

---

## 🖥️ Using the Terminal

### **Dry Run (Preview Only)**

```bash
node intelligent-cleanup.js --dry-run
```

**Output:**
```
═══════════════════════════════════════════════════════════
🧠 INTELLIGENT WATCHLIST CLEANUP
═══════════════════════════════════════════════════════════
Mode: DRY RUN (no changes will be made)

📊 Analyzing 10 tickers...

═══════════════════════════════════════════════════════════
📋 ANALYSIS RESULTS
═══════════════════════════════════════════════════════════
Total Tickers: 10
✅ Keep: 7
🗑️  Remove: 3

⚠️  TICKERS TO REMOVE:
────────────────────────────────────────────────────────────

AMD - Score: 18 | Status: POOR
  Reason: Critically poor performance (Score: 18, Win Rate: 20%, Total P/L: $-75.00)
  Stats: 2W/8L | Win Rate: 20.0% | Total P/L: $-75.00

INTC - Score: 22 | Status: POOR
  Reason: Consistent loser (2W/8L, Win Rate: 20.0%)
  Stats: 2W/8L | Win Rate: 20.0% | Total P/L: $-45.00

💡 DRY RUN: No changes made. Run without --dry-run to execute.

✅ TICKERS TO KEEP:
────────────────────────────────────────────────────────────
🥇 NVDA   | 🟢 Score:  85 | Win Rate:  75.0% | P/L: $ 150.00 | EXCELLENT
🥈 AAPL   | 🟢 Score:  72 | Win Rate:  66.7% | P/L: $ 100.00 | EXCELLENT
🥉 TSLA   | 🟡 Score:  68 | Win Rate:  60.0% | P/L: $  52.00 | GOOD
```

### **Live Execution (Actually Remove)**

```bash
node intelligent-cleanup.js
```

**Output:**
```
🗑️  Removing tickers from watchlist...
   ✓ Removed AMD
   ✓ Removed INTC
   ✓ Removed BA

✅ Cleanup complete! Removed 3 tickers.
```

---

## 🤖 Automatic Behavior

### **During Cron Job Execution**

Every time the cron job runs (every 5 minutes), it:

1. **Auto-cleanup** - Removes poor performers
2. **Evaluates signals** - Decides whether to buy
3. **Post-sell check** - Decides whether to remove after selling

**Example Log:**
```
🧹 Auto-cleanup removed 2 tickers: AMD, INTC

Processing NVDA...
✅ Approved to buy NVDA: Excellent performer (Score: 85, Win Rate: 75.0%)
BUY executed: NVDA x 10 @ $450.00

Processing AMD...
🚫 Skipping AMD: Poor performer (Score: 18, Win Rate: 20.0%) - skipping

Sold INTC...
🗑️  Removing INTC from watchlist: Consistent loser (2W/8L, Win Rate: 20.0%)
```

---

## 📊 Scoring System

Each ticker gets a score from **0-100** based on:

| Factor | Weight | Formula |
|--------|--------|---------|
| **Win Rate** | 50% | (Wins / Total Trades) × 100 × 0.5 |
| **Avg Profit** | 30% | (Avg Profit / $10) × 3 (capped at ±10) |
| **Trade Volume** | 20% | min(Completed Trades / 10, 1) × 20 |

### **Status Categories**

| Score | Status | Meaning |
|-------|--------|---------|
| **70-100** | 🟢 **Excellent** | Keep and prioritize |
| **30-69** | 🟡 **Good** | Keep and monitor |
| **20-29** | 🟠 **Poor** | Consider removing |
| **0-19** | 🔴 **Critical** | Auto-remove |
| **< 3 trades** | ⚪ **Unproven** | Give it a chance |

---

## 🎯 Decision Thresholds

### **Buy Decision**
- **Unproven** (< 3 trades) → ✅ Buy
- **Score ≥ 30** → ✅ Buy
- **Score < 30** → ❌ Skip

### **Remove Decision**
- **Score < 20** → 🗑️ Remove
- **Win Rate < 25%** (after 5+ trades) → 🗑️ Remove
- **Otherwise** → ✅ Keep

---

## 💡 Best Practices

### **1. Let It Learn**
- Start with 5-10 tickers
- Let them run for 2 weeks
- System needs data to make smart decisions

### **2. Weekly Cleanup**
```bash
# Every Monday
node intelligent-cleanup.js --dry-run  # Preview
node intelligent-cleanup.js            # Execute
```

### **3. Trust the System**
- If a ticker has Score < 20 after 10+ trades, **remove it**
- Don't hold onto losers hoping they'll improve
- Focus capital on proven winners (Score ≥ 70)

### **4. Monitor Decisions**
Check the dashboard daily to see:
- Which tickers were skipped (and why)
- Which tickers were removed (and why)
- Which tickers are performing well

### **5. Adjust Thresholds**
Edit `lib/intelligent-trader.ts` to customize:
```typescript
private readonly MIN_TRADES_FOR_EVALUATION = 3  // Default: 3
private readonly EXCELLENT_SCORE = 70           // Default: 70
private readonly POOR_SCORE = 30                // Default: 30
private readonly REMOVE_SCORE = 20              // Default: 20
```

---

## 🔍 Example Scenarios

### **Scenario 1: New Ticker**
```
Day 1: NVDA added to watchlist
Day 2: BUY signal → ✅ Buy (unproven, give it a chance)
Day 3: SELL signal → Profit $15 → ✅ Keep (1W/0L)
Day 5: BUY signal → ✅ Buy (Score: 60, looking good)
Day 7: SELL signal → Profit $20 → ✅ Keep (2W/0L, Score: 75)
```

### **Scenario 2: Poor Performer**
```
Week 1: AMD added to watchlist
Week 2: 3 trades → 1W/2L → Score: 35 → ✅ Keep (needs more data)
Week 3: 5 trades → 1W/4L → Score: 22 → ⚠️ Warning
Week 4: 8 trades → 2W/6L → Score: 18 → 🗑️ Auto-removed
```

### **Scenario 3: Consistent Winner**
```
Month 1: AAPL → 10 trades → 7W/3L → Score: 72 → ✅ Keep
Month 2: AAPL → 20 trades → 14W/6L → Score: 75 → 🏆 Excellent
Month 3: AAPL → 30 trades → 22W/8L → Score: 80 → 🏆 Top performer
```

---

## 🚀 Quick Start

### **1. Enable Intelligent Trading**
It's already enabled! The system automatically:
- Evaluates before buying
- Removes poor performers
- Manages your watchlist

### **2. Check Recommendations**
```bash
# Web dashboard
npm run dev
# Go to http://localhost:3000 → Analytics

# Terminal
node intelligent-cleanup.js --dry-run
```

### **3. Execute Cleanup**
```bash
# Web: Click "Remove X Tickers" button
# Terminal: node intelligent-cleanup.js
```

---

## ✅ Summary

Your auto trader is now **fully autonomous**:

1. ✅ **Learns** from every trade
2. ✅ **Evaluates** before buying
3. ✅ **Removes** poor performers automatically
4. ✅ **Optimizes** watchlist continuously
5. ✅ **Focuses** capital on winners

**Result:** Your bot gets smarter over time and stops wasting money on losers! 🧠🎯

