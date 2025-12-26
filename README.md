# Auto Trader - Automated Stock Trading Bot

An automated stock trading system that uses swing trading strategies to identify dips and execute trades through Alpaca's paper trading API.

## Features

- 🤖 **Automated Trading**: Runs every 15 minutes during market hours
- 🧠 **Intelligent Decision Making**: AI learns from past trades and auto-manages watchlist
- 🎯 **Smart Ticker Selection**: Recommends best stocks based on performance and market conditions
- 📊 **Real-time Dashboard**: Monitor portfolio, positions, and trades
- 📈 **Performance Analytics**: Comprehensive tracking and weekly reports
- 📝 **Auto Watchlist Management**: Removes poor performers, keeps winners
- 🔒 **Paper Trading**: Test strategies with fake money before going live
- 🧪 **Data-Driven Testing**: Run for a week, analyze, and improve

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Trading API**: Alpaca Markets (Paper Trading)
- **Deployment**: Vercel (with Cron Jobs)

## Trading Strategy

The default swing trading strategy uses:

- **Buy Signal**: RSI < 30 (oversold) + 5% dip from 20-day high
- **Sell Signal**: 
  - RSI > 70 (overbought), OR
  - +8% profit target reached, OR
  - -3% stop loss triggered
- **Position Sizing**: $1,000 per position
- **Max Positions**: 5 concurrent positions

All parameters are adjustable through the dashboard.

## Setup Instructions

### 1. Clone and Install

```bash
npm install
```

### 2. Set Up Alpaca Account

1. Sign up for a free account at [Alpaca](https://alpaca.markets/)
2. Navigate to Paper Trading section
3. Generate API keys (Key ID and Secret Key)

### 3. Set Up Supabase

1. Create a new project at [Supabase](https://supabase.com/)
2. Go to SQL Editor and run the schema from `supabase-schema.sql`
3. Get your project URL and API keys from Settings > API

### 4. Configure Environment Variables

Create a `.env.local` file:

```bash
# Alpaca API Keys (Paper Trading)
ALPACA_API_KEY=your_alpaca_api_key
ALPACA_SECRET_KEY=your_alpaca_secret_key
ALPACA_BASE_URL=https://paper-api.alpaca.markets

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Cron Secret (generate a random string)
CRON_SECRET=your_random_secret_string
```

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add all environment variables
4. Deploy!

The cron job will automatically run every 15 minutes during market hours (9:30 AM - 4 PM ET, Monday-Friday).

## Usage

1. **Add Tickers**: Use the Watchlist panel to add stock symbols you want to monitor
2. **Adjust Strategy**: Modify parameters in the Strategy Parameters section
3. **Start Bot**: Click "Start Bot" to enable automated trading
4. **Monitor**: Watch the dashboard for positions, trades, and performance

## 📊 Analytics & Testing

The bot includes comprehensive analytics to help you test and improve your strategy:

### Quick Status Check
```bash
node check-status.js
```

### Daily Performance
```bash
node analyze-performance.js 1
```

### Weekly Report
```bash
node generate-weekly-report.js
```

### Testing Workflow

1. **Run for 1 week** - Let the bot collect data
2. **Analyze results** - See what's working with `generate-weekly-report.js`
3. **Make improvements** - Adjust one parameter at a time
4. **Test again** - Run for another week
5. **Compare** - Did performance improve?

See [TESTING_WORKFLOW.md](TESTING_WORKFLOW.md) for detailed guide.
See [ANALYTICS_GUIDE.md](ANALYTICS_GUIDE.md) for analytics documentation.

## Important Notes

⚠️ **This is for educational purposes only. Always start with paper trading.**

- The bot only trades during market hours (9:30 AM - 4 PM ET)
- Cron jobs run every 15 minutes when the bot is enabled
- All trades are logged to the database
- Analytics track every signal, execution, and portfolio snapshot
- You can switch to live trading by changing the Alpaca API keys and setting `paper: false` in `lib/alpaca.ts`

## Project Structure

```
auto-trader/
├── app/
│   ├── api/              # API routes
│   │   ├── account/      # Alpaca account info
│   │   ├── positions/    # Current positions
│   │   ├── trades/       # Trade history
│   │   ├── watchlist/    # Watchlist management
│   │   ├── strategy/     # Strategy config
│   │   ├── bot/          # Bot status
│   │   └── cron/         # Cron job endpoint
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Dashboard page
├── components/           # React components
├── lib/                  # Utilities
│   ├── alpaca.ts        # Alpaca API client
│   ├── strategy.ts      # Trading strategy logic
│   └── supabase.ts      # Supabase client
├── types/               # TypeScript types
└── supabase-schema.sql  # Database schema

```

## 📚 Documentation

- [SETUP.md](SETUP.md) - Complete setup guide
- [STRATEGY.md](STRATEGY.md) - Trading strategy details
- [ANALYTICS.md](ANALYTICS.md) - Analytics and reporting
- [INTELLIGENT_TRADING.md](INTELLIGENT_TRADING.md) - 🧠 **NEW!** AI-powered decision making
- [TICKER_RECOMMENDATIONS.md](TICKER_RECOMMENDATIONS.md) - 🎯 **NEW!** Smart ticker selection
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide

## License

MIT
