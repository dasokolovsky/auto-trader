# 🤖 Autonomous Trading System - Design Document

## 🎯 Goal
**Maximize portfolio value over 90 days through fully autonomous stock discovery, trading, and optimization.**

---

## 📊 System Architecture

### **Data Sources**
- **Alpaca API:** Get list of all tradable assets, execute trades
- **Yahoo Finance:** Get historical data, real-time quotes, screening

### **1. Stock Universe Management**

#### **A. Stock Screener (Auto-Discovery)**
```
Every Day at Market Open:
├─ Fetch all tradable stocks from Alpaca API (api.listAssets())
│  └─ Filter: status='active', tradable=true, exchange='NASDAQ' or 'NYSE'
├─ Use Yahoo Finance screener for pre-filtered lists:
│  ├─ day_gainers (momentum stocks)
│  ├─ most_actives (high volume)
│  ├─ growth_technology_stocks
│  └─ undervalued_growth_stocks
├─ Combine and filter by minimum criteria:
│  ├─ Price: $5 - $500 (avoid penny stocks and too expensive)
│  ├─ Volume: > 500K shares/day (ensure liquidity)
│  ├─ Market Cap: > $1B (avoid micro-caps)
│  └─ Tradable on Alpaca: Yes
├─ Score each stock (0-100):
│  ├─ Momentum Score (30%): Price vs SMA 50/200
│  ├─ Volatility Score (20%): ATR relative to price
│  ├─ Volume Score (20%): Recent volume vs average
│  ├─ Trend Score (30%): Consistent uptrend
└─ Select Top 50 candidates
```

#### **B. Opportunity Detector**
```
For each candidate:
├─ Check if currently in favorable setup:
│  ├─ RSI < 40 (potential dip buy)
│  ├─ Above SMA 200 (uptrend)
│  ├─ Volume spike (1.5x+ average)
│  └─ Recent pullback (5-10% from high)
├─ If favorable → Add to watchlist
└─ If not → Keep in candidate pool
```

#### **C. Dynamic Watchlist (20-30 stocks)**
```
Maintain optimal watchlist size:
├─ Auto-add: Top scoring opportunities (up to 30 max)
├─ Auto-remove: 
│  ├─ Score < 20 (poor performer)
│  ├─ Win rate < 25% after 5+ trades
│  ├─ No trade opportunity in 14 days (stale)
└─ Rebalance: Daily at market open
```

---

### **2. Intelligent Position Sizing**

#### **A. Capital Allocation Strategy**
```
Total Portfolio: $100,000 (example)

Position Sizing by Score:
├─ Excellent (Score 70-100): $3,000 - $5,000 per position
├─ Good (Score 50-69):      $2,000 - $3,000 per position
├─ Unproven (< 3 trades):   $1,000 - $1,500 per position
└─ Poor (Score < 50):       $0 (skip)

Max Positions: 10 concurrent
Max % per position: 10% of portfolio
Max % per sector: 30% of portfolio
```

#### **B. Kelly Criterion (Optional)**
```
Position Size = (Win Rate × Avg Win - Loss Rate × Avg Loss) / Avg Win
├─ Conservative: Use 25% of Kelly (safer)
├─ Moderate: Use 50% of Kelly
└─ Aggressive: Use 75% of Kelly
```

---

### **3. Risk Management**

#### **A. Position-Level Limits**
```
Per Position:
├─ Max Loss: -5% (hard stop)
├─ Max Position Size: 10% of portfolio
├─ ATR-based stops: 2x ATR below entry
└─ Profit target: 3x ATR above entry
```

#### **B. Portfolio-Level Limits**
```
Portfolio:
├─ Max Daily Loss: -2% of portfolio value
├─ Max Drawdown: -15% from peak
├─ Max Positions: 10 concurrent
├─ Max % in single sector: 30%
└─ Min Cash Reserve: 20% (for opportunities)
```

#### **C. Sector Diversification**
```
Limit exposure per sector:
├─ Technology: Max 30%
├─ Healthcare: Max 20%
├─ Finance: Max 20%
├─ Consumer: Max 20%
├─ Energy: Max 10%
└─ Other: Max 10%
```

---

### **4. 90-Day Optimization Engine**

#### **A. Performance Tracking**
```
Daily Metrics:
├─ Portfolio Value
├─ Daily Return %
├─ Sharpe Ratio (rolling 30-day)
├─ Max Drawdown
├─ Win Rate
├─ Profit Factor
└─ Best/Worst Performers
```

#### **B. Strategy Adaptation**
```
Every 7 Days:
├─ Analyze what's working:
│  ├─ Which stocks are winning?
│  ├─ Which entry signals are best?
│  ├─ Which exit signals are best?
│  └─ Which sectors are performing?
├─ Adjust parameters:
│  ├─ RSI thresholds (if too many/few signals)
│  ├─ Position sizes (allocate more to winners)
│  ├─ Stop losses (tighten if too many losses)
│  └─ Profit targets (raise if hitting too early)
└─ Rebalance watchlist (add winners, remove losers)
```

#### **C. Compound Growth**
```
Reinvestment Strategy:
├─ Profits → Increase position sizes proportionally
├─ Losses → Decrease position sizes (preserve capital)
├─ Target: 2-3% weekly growth (compounded = 25-40% over 90 days)
└─ Conservative: 1% weekly = 13% over 90 days
```

---

### **5. Automation Flow**

#### **Daily (Market Open - 9:30 AM ET)**
```
1. Run Stock Screener → Find top 50 candidates
2. Evaluate Opportunities → Add to watchlist (up to 30)
3. Remove Stale Stocks → Clean watchlist
4. Check Risk Limits → Ensure compliance
5. Calculate Position Sizes → Based on scores
```

#### **Every 15 Minutes (During Market Hours)**
```
1. Generate Signals → For all watchlist stocks
2. Evaluate Buy Decisions → Use intelligent trader
3. Check Risk Limits → Before executing
4. Execute Trades → If all checks pass
5. Log Everything → For analysis
```

#### **Daily (Market Close - 4:00 PM ET)**
```
1. Take Portfolio Snapshot → Daily performance
2. Calculate Metrics → Sharpe, drawdown, etc.
3. Analyze Performance → What worked today?
4. Prepare for Tomorrow → Adjust if needed
```

#### **Weekly (Sunday)**
```
1. Generate Performance Report
2. Analyze 7-day trends
3. Adjust strategy parameters
4. Rebalance watchlist
5. Plan for next week
```

---

## 🎯 Expected Performance (90 Days)

### **Conservative Scenario**
- Weekly Return: 1%
- 90-Day Return: ~13%
- Max Drawdown: <10%
- Sharpe Ratio: >1.0

### **Moderate Scenario**
- Weekly Return: 2%
- 90-Day Return: ~25%
- Max Drawdown: <15%
- Sharpe Ratio: >1.5

### **Aggressive Scenario**
- Weekly Return: 3%
- 90-Day Return: ~40%
- Max Drawdown: <20%
- Sharpe Ratio: >2.0

---

## 🚀 Implementation Priority

1. **Phase 1 (Week 1):** Stock screener + auto-discovery
2. **Phase 2 (Week 2):** Dynamic position sizing + risk management
3. **Phase 3 (Week 3):** 90-day optimization engine
4. **Phase 4 (Week 4):** Testing + refinement

---

**Next Steps:** Implement each component systematically.

