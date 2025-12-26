# 🚀 Vercel Deployment Quick Reference

## 📍 Your URLs

**Production**: https://auto-trader-umber.vercel.app
**Dashboard**: https://vercel.com/warp-71426268/auto-trader

---

## ✅ Deployment Status

Everything is configured and working! ✨

### What's Deployed:
- ✅ Next.js application
- ✅ All API routes
- ✅ Environment variables (production)
- ✅ Cron jobs configured
- ✅ Connected to Supabase
- ✅ Connected to Alpaca (paper trading)

---

## 🔧 Quick Commands

### Deploy to Production
```bash
npx vercel --prod
```

### View Environment Variables
```bash
npx vercel env ls
```

### Add Environment Variable
```bash
echo "VALUE" | npx vercel env add VAR_NAME production
```

### View Logs
```bash
npx vercel logs https://auto-trader-umber.vercel.app
```

### Pull Environment Variables Locally
```bash
npx vercel env pull .env.vercel
```

---

## 🧪 Test Your Deployment

### Check Bot Status
```bash
curl https://auto-trader-umber.vercel.app/api/bot/status | jq .
```

### Check Watchlist
```bash
curl https://auto-trader-umber.vercel.app/api/watchlist | jq .
```

### Check Strategy
```bash
curl https://auto-trader-umber.vercel.app/api/strategy | jq .
```

### Check Positions
```bash
curl https://auto-trader-umber.vercel.app/api/positions | jq .
```

### Check Trades
```bash
curl https://auto-trader-umber.vercel.app/api/trades | jq .
```

### Add Ticker to Watchlist
```bash
curl -X POST https://auto-trader-umber.vercel.app/api/watchlist \
  -H "Content-Type: application/json" \
  -d '{"ticker":"MSFT"}'
```

---

## ⏰ Cron Jobs

### Strategy Execution
- **Schedule**: Every 15 minutes during market hours (9 AM - 4 PM EST, Mon-Fri)
- **Endpoint**: `/api/cron/execute-strategy`
- **What it does**: Analyzes watchlist, generates signals, places trades

### Daily Snapshot
- **Schedule**: 5 PM EST every weekday
- **Endpoint**: `/api/cron/daily-snapshot`
- **What it does**: Records daily performance metrics

### Monitor Cron Jobs
1. Go to https://vercel.com/warp-71426268/auto-trader
2. Click "Cron" in the sidebar
3. View execution history and logs

---

## 🔐 Environment Variables

All configured in production:
- `ALPACA_API_KEY`
- `ALPACA_SECRET_KEY`
- `ALPACA_BASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`

---

## 📊 Monitoring

### Vercel Dashboard
- **Deployments**: See all deployments and their status
- **Analytics**: Traffic, performance metrics
- **Logs**: Runtime logs and errors
- **Cron**: Scheduled job execution logs

### Supabase Dashboard
- **Database**: https://supabase.com/dashboard/project/jtcyaetmjdgosmgycwwh
- **Tables**: trades, positions, signals, watchlist, etc.
- **Logs**: Database queries and API calls

---

## 🐛 Troubleshooting

### Deployment Failed
```bash
# Check build logs
npx vercel logs --follow

# Redeploy
npx vercel --prod
```

### Environment Variable Issues
```bash
# List all env vars
npx vercel env ls

# Remove and re-add
npx vercel env rm VAR_NAME production
echo "NEW_VALUE" | npx vercel env add VAR_NAME production
```

### Cron Jobs Not Running
1. Check Vercel dashboard → Cron tab
2. Verify `vercel.json` has correct schedule
3. Check cron execution logs for errors

---

## 🎯 Next Steps

1. **Monitor First Cron Run**: Wait for market hours and check cron execution
2. **Add More Tickers**: Use the API to add tickers to watchlist
3. **Review Trades**: Check Supabase for any trades placed
4. **Set Up Alerts**: Consider adding email/SMS notifications
5. **Connect Git**: Link to GitHub for automatic deployments

---

## 📱 Mobile Access

Your dashboard is mobile-responsive! Access it from anywhere:
https://auto-trader-umber.vercel.app

---

## 🔄 Continuous Deployment

To enable automatic deployments on every git push:
1. Push your code to GitHub
2. Go to Vercel dashboard
3. Click "Connect Git Repository"
4. Select your repo
5. Every push to main will auto-deploy!

---

**Happy Trading! 📈**

