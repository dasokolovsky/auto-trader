# Going Live Checklist

⚠️ **IMPORTANT**: Only proceed with live trading after extensive testing with paper trading!

## Prerequisites (Must Complete All)

- [ ] Successfully run paper trading for at least 2-4 weeks
- [ ] Reviewed all trades and understand the strategy behavior
- [ ] Achieved consistent positive results in paper trading
- [ ] Fully understand the risks involved
- [ ] Have capital you can afford to lose
- [ ] Comfortable with the max drawdown observed in paper trading
- [ ] Tested during different market conditions (volatile, calm, trending)

## Pre-Live Testing Checklist

- [ ] Verified all buy signals are accurate
- [ ] Verified all sell signals are accurate
- [ ] Confirmed stop losses trigger correctly
- [ ] Confirmed profit targets trigger correctly
- [ ] Tested with multiple tickers
- [ ] Reviewed edge cases (gaps, halts, low volume)
- [ ] Monitored bot for at least 50 trades
- [ ] Win rate is acceptable (>50% recommended)
- [ ] Average profit > average loss
- [ ] No unexpected behavior or bugs

## Risk Management Review

- [ ] Position size is appropriate (recommend max 2-5% of capital per position)
- [ ] Max positions limit is conservative (start with 3-5)
- [ ] Stop loss percentage is reasonable (3-5% recommended)
- [ ] Total capital at risk is acceptable
- [ ] Have emergency stop plan
- [ ] Understand maximum potential loss

## Technical Checklist

- [ ] All environment variables are correct
- [ ] Vercel deployment is stable
- [ ] Cron jobs are running reliably
- [ ] Database is backed up
- [ ] Monitoring/alerting is set up
- [ ] Have access to Alpaca dashboard for manual intervention
- [ ] Tested manual override procedures

## Alpaca Live Trading Setup

### 1. Enable Live Trading on Alpaca

1. Log into your Alpaca account
2. Complete the account verification process (may take 1-2 business days)
3. Fund your account (start small!)
4. Navigate to Live Trading section
5. Generate Live Trading API keys

### 2. Update Environment Variables

Update `.env.local` and Vercel environment variables:

```bash
# Change these to LIVE keys
ALPACA_API_KEY=your_live_key_here
ALPACA_SECRET_KEY=your_live_secret_here
ALPACA_BASE_URL=https://api.alpaca.markets  # Remove "paper-"
```

### 3. Update Code

Edit `lib/alpaca.ts`:

```typescript
constructor() {
  this.client = new Alpaca({
    keyId: process.env.ALPACA_API_KEY!,
    secretKey: process.env.ALPACA_SECRET_KEY!,
    paper: false,  // Change from true to false
    usePolygon: false,
  })
}
```

### 4. Reduce Position Sizes (Recommended)

Start with smaller positions than paper trading:

1. Go to Strategy Controls in dashboard
2. Reduce "Position Size" to $100-$500 initially
3. Reduce "Max Positions" to 2-3 initially
4. Consider tighter stop loss (2-3%)

## Launch Day Checklist

- [ ] Market is open
- [ ] You can monitor the bot actively
- [ ] Have Alpaca dashboard open
- [ ] Have your dashboard open
- [ ] Phone/email notifications working (if implemented)
- [ ] Ready to manually intervene if needed
- [ ] Documented your starting capital

## First Week Monitoring

- [ ] Check bot status every hour during market hours
- [ ] Review every trade immediately after execution
- [ ] Monitor for any errors or unexpected behavior
- [ ] Compare live vs paper trading performance
- [ ] Keep detailed notes of observations
- [ ] Be ready to stop bot if issues arise

## When to Stop the Bot

Stop immediately if:
- Unexpected trades are executed
- Trades execute at wrong prices
- Bot ignores stop losses
- Any technical errors occur
- Losses exceed your risk tolerance
- Market conditions change dramatically
- You're uncomfortable with performance

## Gradual Scale-Up Plan

Week 1-2:
- Position size: $100-$500
- Max positions: 2-3
- Monitor constantly

Week 3-4:
- If performing well, increase position size to $500-$1000
- Max positions: 3-4
- Monitor daily

Month 2+:
- Gradually increase to target position sizes
- Max positions: 4-5
- Monitor regularly

## Emergency Procedures

### How to Stop Everything Immediately

1. **Dashboard**: Click "Stop Bot" button
2. **Alpaca**: Log in and cancel all open orders
3. **Vercel**: Disable cron job in vercel.json and redeploy
4. **Manual**: Close all positions manually if needed

### Emergency Contacts

- Alpaca Support: support@alpaca.markets
- Your broker's phone number: _______________
- Your emergency contact: _______________

## Performance Tracking

Track these metrics weekly:
- Total P/L
- Win rate
- Average win vs average loss
- Max drawdown
- Number of trades
- Sharpe ratio (if possible)

## Legal & Compliance

- [ ] Understand tax implications of trading
- [ ] Keep detailed records for tax purposes
- [ ] Comply with pattern day trader rules (if applicable)
- [ ] Understand your broker's terms of service
- [ ] Consider consulting with a financial advisor

## Final Confirmation

I understand that:
- [ ] Trading involves substantial risk of loss
- [ ] Past performance does not guarantee future results
- [ ] I could lose all capital invested
- [ ] This is not financial advice
- [ ] I am solely responsible for my trading decisions
- [ ] I have tested thoroughly with paper trading
- [ ] I am comfortable with the risks involved

---

## Recommended Reading Before Going Live

1. Alpaca's risk disclosure documents
2. SEC's guide to pattern day trading
3. Your local regulations on algorithmic trading
4. Tax implications of active trading

---

**Remember**: Start small, monitor closely, and scale gradually. It's better to miss opportunities than to lose capital due to untested systems.

**When in doubt, stay in paper trading mode!**

