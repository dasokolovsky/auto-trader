# Quick Start Guide

Get your auto trader running in 5 minutes!

## Prerequisites

- Node.js installed
- Alpaca account (free paper trading)
- Supabase account (free tier)

## 1. Get API Keys

### Alpaca (2 minutes)
1. Sign up at [alpaca.markets](https://alpaca.markets)
2. Go to Paper Trading → API Keys
3. Generate new key → Save Key ID and Secret

### Supabase (3 minutes)
1. Sign up at [supabase.com](https://supabase.com)
2. Create new project (wait ~2 min)
3. SQL Editor → New Query → Paste `supabase-schema.sql` → Run
4. Settings → API → Copy URL, anon key, and service_role key

## 2. Configure Environment

Create `.env.local`:

```bash
ALPACA_API_KEY=your_key_here
ALPACA_SECRET_KEY=your_secret_here
ALPACA_BASE_URL=https://paper-api.alpaca.markets

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

CRON_SECRET=any_random_string_you_wantis this 
```

## 3. Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 4. Test It

1. Add "TSLA" to watchlist
2. Click "Start Bot"
3. Check portfolio overview loads
4. View positions table

## 5. Deploy to Vercel

```bash
# Push to GitHub first
git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main

# Then deploy
# 1. Go to vercel.com
# 2. Import your GitHub repo
# 3. Add all environment variables from .env.local
# 4. Deploy!
```

## Default Strategy

- **Buy**: RSI < 30 + 5% dip
- **Sell**: RSI > 70 OR +8% profit OR -3% loss
- **Position Size**: $1,000
- **Max Positions**: 5

## Troubleshooting

**Can't see portfolio?**
→ Check Alpaca keys in `.env.local`

**Watchlist empty?**
→ Run `supabase-schema.sql` in Supabase SQL Editor

**Bot not trading?**
→ Market must be open (9:30 AM - 4 PM ET, Mon-Fri)

## What's Next?

- Monitor during market hours
- Adjust strategy parameters
- Add more tickers to watchlist
- Review trade history
- Fine-tune based on performance

## 📊 Analytics & Testing

After your first day:
```bash
node check-status.js          # Quick status check
node analyze-performance.js 1 # Daily performance
```

After a week:
```bash
node generate-weekly-report.js  # Comprehensive analysis
```

See [TESTING_WORKFLOW.md](TESTING_WORKFLOW.md) for the complete testing guide.

---

**⚠️ Important**: This is paper trading (fake money). Test thoroughly before considering live trading!

