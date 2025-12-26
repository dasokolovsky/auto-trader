# Auto Trader - Project Summary

## Overview

A fully functional automated stock trading system built with Next.js, deployed on Vercel, using Alpaca for paper trading and Supabase for data storage.

## What's Been Built

### ✅ Core Infrastructure
- Next.js 14 app with TypeScript and Tailwind CSS
- Supabase database integration with complete schema
- Alpaca API client wrapper for paper trading
- Vercel cron job configuration (runs every 15 minutes during market hours)

### ✅ Trading Engine
- **RSI Calculation**: 14-period Relative Strength Index
- **Dip Detection**: Identifies price drops from recent highs
- **Buy Signals**: RSI < 30 + 5% dip from 20-day high
- **Sell Signals**: RSI > 70 OR +8% profit OR -3% stop loss
- **Position Management**: Max 5 positions, $1000 per position
- **Market Hours Check**: Only trades 9:30 AM - 4 PM ET, Mon-Fri

### ✅ API Endpoints
- `/api/account` - Get Alpaca account info
- `/api/positions` - Get current positions
- `/api/trades` - Get trade history
- `/api/watchlist` - Manage watchlist (GET, POST, DELETE)
- `/api/strategy` - Get/update strategy parameters
- `/api/bot/status` - Get/update bot running status
- `/api/cron/execute-strategy` - Main trading execution (cron job)

### ✅ Dashboard Components
1. **Portfolio Overview** - Total value, equity, cash, buying power
2. **Bot Controls** - Start/stop bot, view status and last run time
3. **Active Positions Table** - Real-time P/L, entry/current prices
4. **Watchlist Panel** - Add/remove tickers to monitor
5. **Strategy Controls** - Adjust all trading parameters
6. **Trade History** - Complete log of all executed trades

### ✅ Database Schema (Supabase)
- `watchlist` - Tickers to monitor
- `trades` - Complete trade history
- `strategy_config` - Trading parameters
- `bot_status` - Bot state and last run info
- `notifications` - Notification log (for future use)

## File Structure

```
auto-trader/
├── app/
│   ├── api/
│   │   ├── account/route.ts          # Alpaca account endpoint
│   │   ├── positions/route.ts        # Current positions
│   │   ├── trades/route.ts           # Trade history
│   │   ├── watchlist/route.ts        # Watchlist CRUD
│   │   ├── strategy/route.ts         # Strategy config
│   │   ├── bot/status/route.ts       # Bot control
│   │   └── cron/execute-strategy/route.ts  # Main trading logic
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                      # Main dashboard
├── components/
│   ├── BotControls.tsx               # Start/stop bot
│   ├── PortfolioOverview.tsx         # Account summary
│   ├── PositionsTable.tsx            # Active positions
│   ├── StrategyControls.tsx          # Parameter controls
│   ├── TradeHistory.tsx              # Trade log
│   └── Watchlist.tsx                 # Ticker management
├── lib/
│   ├── alpaca.ts                     # Alpaca API client
│   ├── strategy.ts                   # Trading strategy engine
│   └── supabase.ts                   # Supabase client
├── types/
│   └── index.ts                      # TypeScript types
├── supabase-schema.sql               # Database schema
├── vercel.json                       # Cron job config
├── .env.example                      # Environment template
├── README.md                         # Project overview
├── SETUP_GUIDE.md                    # Detailed setup steps
└── package.json                      # Dependencies
```

## How It Works

### Trading Flow

1. **Cron Trigger**: Vercel cron runs every 15 minutes during market hours
2. **Market Check**: Verifies market is open via Alpaca API
3. **Bot Status Check**: Confirms bot is enabled in database
4. **Fetch Watchlist**: Gets active tickers from Supabase
5. **Get Positions**: Retrieves current positions from Alpaca
6. **For Each Ticker**:
   - Fetch 100 days of historical price data
   - Calculate RSI and dip percentage
   - Generate buy/sell signal based on strategy
   - Execute trade if signal is triggered
   - Log trade to database
7. **Update Status**: Record last run time and any errors

### Strategy Logic

**Buy Conditions** (all must be true):
- No existing position in this ticker
- RSI < 30 (oversold)
- Price dropped ≥5% from 20-day high
- Haven't reached max positions (5)
- Sufficient buying power

**Sell Conditions** (any can trigger):
- RSI > 70 (overbought)
- Profit ≥ 8% from entry
- Loss ≥ 3% from entry (stop loss)

## Configuration

All strategy parameters are adjustable via the dashboard:

- **RSI Oversold**: Default 30
- **RSI Overbought**: Default 70
- **Dip Percentage**: Default 5%
- **Profit Target**: Default 8%
- **Stop Loss**: Default 3%
- **Max Positions**: Default 5
- **Position Size**: Default $1,000
- **Lookback Days**: Default 20

## Next Steps

### Immediate (Required for Operation)
1. Set up Alpaca account and get API keys
2. Create Supabase project and run schema
3. Configure `.env.local` with all credentials
4. Test locally with `npm run dev`
5. Deploy to Vercel

### Future Enhancements (Optional)
1. **Notifications**: Email/SMS alerts for trades (SendGrid/Twilio)
2. **Charts**: Price charts with buy/sell markers (Recharts)
3. **Backtesting**: Test strategy on historical data
4. **Multiple Strategies**: Support different strategies per ticker
5. **Risk Management**: Portfolio-level risk controls
6. **Performance Analytics**: Win rate, Sharpe ratio, max drawdown
7. **Advanced Indicators**: MACD, Bollinger Bands, Moving Averages
8. **News Integration**: Factor in news sentiment
9. **Machine Learning**: Predictive models for better signals
10. **Mobile App**: React Native companion app

## Security Notes

- ✅ Cron endpoint protected with `CRON_SECRET`
- ✅ Supabase service role key only used server-side
- ✅ Alpaca keys never exposed to client
- ✅ All sensitive data in environment variables
- ⚠️ No authentication yet (single user assumed)

## Testing Checklist

Before going live:
- [ ] Verify Alpaca connection (check portfolio overview)
- [ ] Add test ticker to watchlist
- [ ] Confirm strategy parameters are correct
- [ ] Start bot and verify status updates
- [ ] Wait for market hours and check for trade execution
- [ ] Review trade history for accuracy
- [ ] Test stop loss and profit targets
- [ ] Monitor for several days with paper trading
- [ ] Review performance and adjust parameters
- [ ] Only then consider switching to live trading

## Important Warnings

⚠️ **This is for educational purposes**
⚠️ **Always start with paper trading**
⚠️ **Past performance ≠ future results**
⚠️ **Trading involves risk of loss**
⚠️ **Never invest more than you can afford to lose**

## Support & Maintenance

- Monitor Vercel logs for errors
- Check Supabase logs for database issues
- Review Alpaca dashboard for trade confirmations
- Keep dependencies updated (`npm update`)
- Monitor for Next.js security updates

