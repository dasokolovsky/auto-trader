# 📊 Frontend Analytics

## ✅ What's Available

Your auto trader now has **both terminal and web-based analytics**!

### 🖥️ **Terminal Analytics** (Already Built)

Run these commands in your terminal:

```bash
# Quick status check
node check-status.js

# Daily performance
node analyze-performance.js 1

# Weekly comprehensive report
node generate-weekly-report.js
```

### 🌐 **Web Dashboard Analytics** (Just Added!)

Now available in your browser at `http://localhost:3000`

**New "Analytics" Tab** shows:
- 📊 Total P/L
- 🎯 Win Rate (W/L ratio)
- 📈 Total Trades
- 🔄 Signal Execution Rate
- 📋 Completed Trades Table

**Features:**
- Switch between 1 day, 7 days, or 30 days
- Real-time data from your database
- Visual cards with key metrics
- Detailed trade history table

---

## 🚀 How to Use

### 1. Start the App

```bash
npm run dev
```

### 2. Open Dashboard

Go to `http://localhost:3000`

### 3. Click "Analytics" Tab

You'll see two tabs at the top:
- **📊 Overview** - Your existing dashboard (portfolio, positions, trades)
- **📈 Analytics** - New performance analytics

### 4. Select Time Period

Click the buttons to view:
- **Today** - Last 24 hours
- **7 Days** - Last week
- **30 Days** - Last month

---

## 📊 What You'll See

### Performance Cards

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Total P/L      │  │  Win Rate       │  │  Total Trades   │  │  Signal Rate    │
│  $250.00 🟢     │  │  66.7%          │  │  3              │  │  14.3%          │
│                 │  │  2W / 1L        │  │  3 buys / 3 sells│  │  6 / 42 executed│
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Completed Trades Table

| Ticker | Buy Date   | Sell Date  | P/L      | Return % |
|--------|------------|------------|----------|----------|
| TSLA   | 12/20/2024 | 12/22/2024 | $150.00  | +5.2%    |
| AAPL   | 12/19/2024 | 12/21/2024 | -$50.00  | -2.1%    |
| NVDA   | 12/18/2024 | 12/23/2024 | $150.00  | +6.8%    |

---

## 🔄 Terminal vs Web Analytics

### Use **Terminal** for:
- ✅ Detailed weekly reports
- ✅ Recommendations for improvements
- ✅ Trade-by-trade analysis with reasons
- ✅ Exporting data
- ✅ Running automated analysis scripts

### Use **Web Dashboard** for:
- ✅ Quick at-a-glance metrics
- ✅ Real-time updates
- ✅ Visual presentation
- ✅ Easy time period switching
- ✅ Sharing with others (just open browser)

---

## 🎨 Customizing the Frontend

Want to add more charts or metrics? Edit these files:

### Add New Metrics to API
`app/api/analytics/performance/route.ts`

```typescript
// Add your custom calculation
const myMetric = calculateSomething(trades)

// Return it in the response
return NextResponse.json({
  // ... existing data
  myMetric
})
```

### Display in Dashboard
`components/AnalyticsDashboard.tsx`

```tsx
<div className="bg-white p-4 rounded-lg shadow">
  <div className="text-sm text-gray-500">My Metric</div>
  <div className="text-2xl font-bold">
    {data.myMetric}
  </div>
</div>
```

---

## 📈 Future Enhancements

Easy additions you can make:

1. **Charts** - Add a charting library like `recharts`:
   ```bash
   npm install recharts
   ```
   Then add line charts for portfolio value over time

2. **Export to CSV** - Add a button to download trade data

3. **Filters** - Filter by ticker, date range, profit/loss

4. **Alerts** - Show notifications for big wins/losses

5. **Comparison** - Compare different time periods side-by-side

---

## 🐛 Troubleshooting

### "Failed to load analytics"
- Check that analytics tables exist in Supabase
- Run the SQL schema: `supabase-analytics-schema.sql`
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set

### "No data showing"
- Bot needs to run for at least a day to collect data
- Check that trades exist in the database
- Try selecting a longer time period (30 days)

### "Loading forever"
- Check browser console for errors
- Verify API endpoint works: `curl http://localhost:3000/api/analytics/performance?days=7`

---

## ✅ Summary

You now have **two ways** to view analytics:

1. **Terminal** - Detailed reports and recommendations
   ```bash
   node generate-weekly-report.js
   ```

2. **Web Dashboard** - Visual, real-time metrics
   ```
   http://localhost:3000 → Click "Analytics" tab
   ```

Both pull from the same database, so the data is always in sync! 🎉

