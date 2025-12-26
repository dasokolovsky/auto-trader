# Auto Trader Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER (You)                               │
│                    Browser Dashboard                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL (Hosting)                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Next.js Application                          │  │
│  │                                                            │  │
│  │  ┌─────────────────┐      ┌──────────────────┐          │  │
│  │  │   Dashboard     │      │   API Routes     │          │  │
│  │  │   Components    │◄────►│   (7 endpoints)  │          │  │
│  │  └─────────────────┘      └──────────────────┘          │  │
│  │                                    │                      │  │
│  │                                    │                      │  │
│  │  ┌─────────────────────────────────┼──────────────────┐ │  │
│  │  │         Business Logic          │                  │ │  │
│  │  │                                 ▼                  │ │  │
│  │  │  ┌──────────────┐    ┌──────────────────┐        │ │  │
│  │  │  │   Alpaca     │    │   Trading        │        │ │  │
│  │  │  │   Client     │    │   Strategy       │        │ │  │
│  │  │  │              │    │   (RSI, Signals) │        │ │  │
│  │  │  └──────────────┘    └──────────────────┘        │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Vercel Cron Job                             │  │
│  │   Runs: */15 9-16 * * 1-5 (Every 15 min, market hrs) │  │
│  │   Triggers: /api/cron/execute-strategy               │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────┬──────────────────────────┬────────────────────┘
             │                          │
             │ API Calls                │ Database Queries
             ▼                          ▼
┌─────────────────────┐    ┌──────────────────────────┐
│   Alpaca Markets    │    │      Supabase            │
│   (Trading API)     │    │   (PostgreSQL DB)        │
│                     │    │                          │
│  • Account Info     │    │  Tables:                 │
│  • Positions        │    │  • watchlist             │
│  • Orders           │    │  • trades                │
│  • Market Data      │    │  • strategy_config       │
│  • Execute Trades   │    │  • bot_status            │
│                     │    │  • notifications         │
└─────────────────────┘    └──────────────────────────┘
```

## Data Flow

### 1. User Interaction Flow
```
User clicks "Start Bot"
    ↓
Dashboard → API: POST /api/bot/status
    ↓
API → Supabase: UPDATE bot_status SET is_running = true
    ↓
Response → Dashboard: Bot started
```

### 2. Automated Trading Flow (Every 15 minutes)
```
Vercel Cron Trigger
    ↓
GET /api/cron/execute-strategy
    ↓
Check: Is bot running? (Supabase)
    ↓
Check: Is market open? (Alpaca)
    ↓
Fetch: Watchlist (Supabase)
    ↓
Fetch: Current Positions (Alpaca)
    ↓
For each ticker in watchlist:
    ↓
    Fetch: 100 days price history (Alpaca)
    ↓
    Calculate: RSI, Dip %
    ↓
    Generate: Buy/Sell Signal
    ↓
    If BUY signal:
        → Execute: Market Buy Order (Alpaca)
        → Log: Trade to database (Supabase)
    ↓
    If SELL signal:
        → Execute: Market Sell Order (Alpaca)
        → Log: Trade to database (Supabase)
    ↓
Update: Last run timestamp (Supabase)
```

### 3. Dashboard Data Flow
```
User opens dashboard
    ↓
Component: PortfolioOverview
    → GET /api/account
    → Alpaca: Get account info
    → Display: Portfolio value, cash, equity
    ↓
Component: PositionsTable
    → GET /api/positions
    → Alpaca: Get current positions
    → Display: Active positions with P/L
    ↓
Component: Watchlist
    → GET /api/watchlist
    → Supabase: Get watchlist
    → Display: Tickers being monitored
    ↓
Component: TradeHistory
    → GET /api/trades
    → Supabase: Get trade history
    → Display: Past trades
    ↓
Component: StrategyControls
    → GET /api/strategy
    → Supabase: Get strategy config
    → Display: Current parameters
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (React)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts (ready to use)
- **Date Handling**: date-fns

### Backend
- **Runtime**: Node.js (Vercel serverless)
- **API**: Next.js API Routes
- **Validation**: Zod (installed, ready to use)

### External Services
- **Hosting**: Vercel
- **Database**: Supabase (PostgreSQL)
- **Trading**: Alpaca Markets API
- **Cron**: Vercel Cron Jobs

## Security Architecture

```
Environment Variables (Secrets)
    ↓
Stored in: Vercel Environment Variables
    ↓
Accessed by: Server-side code only
    ↓
Never exposed to: Client/Browser

Cron Endpoint Protection:
    ↓
Authorization: Bearer {CRON_SECRET}
    ↓
Only Vercel cron can call it
```

## Database Schema

```
watchlist
├── id (UUID, PK)
├── ticker (VARCHAR, UNIQUE)
├── added_at (TIMESTAMP)
└── is_active (BOOLEAN)

trades
├── id (UUID, PK)
├── ticker (VARCHAR)
├── side (buy/sell)
├── quantity (DECIMAL)
├── price (DECIMAL)
├── total_value (DECIMAL)
├── executed_at (TIMESTAMP)
├── strategy_params (JSONB)
└── alpaca_order_id (VARCHAR)

strategy_config
├── id (UUID, PK)
├── name (VARCHAR)
├── is_active (BOOLEAN)
├── params (JSONB)
└── updated_at (TIMESTAMP)

bot_status
├── id (UUID, PK)
├── is_running (BOOLEAN)
├── last_run_at (TIMESTAMP)
├── last_error (TEXT)
└── updated_at (TIMESTAMP)
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/account` | GET | Get Alpaca account info |
| `/api/positions` | GET | Get current positions |
| `/api/trades` | GET | Get trade history |
| `/api/watchlist` | GET, POST, DELETE | Manage watchlist |
| `/api/strategy` | GET, PUT | Get/update strategy |
| `/api/bot/status` | GET, POST | Get/update bot status |
| `/api/cron/execute-strategy` | GET | Execute trading (cron) |

## Deployment Architecture

```
GitHub Repository
    ↓
    Push to main branch
    ↓
Vercel Auto-Deploy
    ↓
    Build Next.js app
    ↓
    Deploy to Edge Network
    ↓
    Configure Cron Jobs
    ↓
Production Live ✓
```

## Scalability

- **Serverless**: Auto-scales with traffic
- **Edge Network**: Global CDN distribution
- **Database**: Supabase handles scaling
- **Cron Jobs**: Vercel manages execution
- **No servers to manage**: Fully managed infrastructure

## Monitoring Points

1. **Vercel Logs**: Function execution logs
2. **Supabase Logs**: Database queries
3. **Alpaca Dashboard**: Trade confirmations
4. **Bot Status**: Last run time, errors
5. **Trade History**: All executed trades

---

This architecture is production-ready and can handle real trading workloads!

