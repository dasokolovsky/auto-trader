# Auto Trader Setup Guide

Follow these steps to get your automated trading bot up and running.

## Step 1: Alpaca Setup

1. Go to [https://alpaca.markets/](https://alpaca.markets/)
2. Click "Sign Up" and create a free account
3. After logging in, navigate to the **Paper Trading** section
4. Go to "Your API Keys" in the left sidebar
5. Click "Generate New Key"
6. **Save these keys securely** - you'll need them for the `.env.local` file:
   - API Key ID
   - Secret Key

## Step 2: Supabase Setup

1. Go to [https://supabase.com/](https://supabase.com/)
2. Click "Start your project" and sign in with GitHub
3. Click "New Project"
4. Fill in:
   - **Name**: auto-trader (or any name you prefer)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you (e.g., US West)
5. Click "Create new project" and wait ~2 minutes for setup

### Run the Database Schema

1. In your Supabase project, click "SQL Editor" in the left sidebar
2. Click "New Query"
3. Open the `supabase-schema.sql` file from this project
4. Copy the entire contents and paste into the SQL Editor
5. Click "Run" to execute the schema
6. You should see "Success. No rows returned"

### Get Your Supabase Keys

1. Click "Settings" (gear icon) in the left sidebar
2. Click "API" under Project Settings
3. You'll need these values:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")
   - **service_role** key (under "Project API keys" - click "Reveal" to see it)

## Step 3: Environment Variables

1. In your project root, create a file named `.env.local`
2. Copy the contents from `.env.example`
3. Fill in your actual values:

```bash
# Alpaca API Keys (from Step 1)
ALPACA_API_KEY=PK...
ALPACA_SECRET_KEY=...
ALPACA_BASE_URL=https://paper-api.alpaca.markets

# Supabase (from Step 2)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Cron Secret (generate a random string - can be anything)
CRON_SECRET=my-super-secret-random-string-12345

# Notifications (optional - skip for now)
# SENDGRID_API_KEY=
# TWILIO_ACCOUNT_SID=
# TWILIO_AUTH_TOKEN=
# TWILIO_PHONE_NUMBER=
# NOTIFICATION_EMAIL=
# NOTIFICATION_PHONE=
```

## Step 4: Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You should see the Auto Trader dashboard!

## Step 5: Test the System

1. **Check Portfolio**: The Portfolio Overview should show your Alpaca paper trading account balance
2. **Add a Ticker**: In the Watchlist panel, add "TSLA" (or any stock symbol)
3. **Review Strategy**: Check the Strategy Parameters - these are the default settings
4. **Start the Bot**: Click "Start Bot" in the Bot Controls section

Note: The bot will only execute trades during market hours (9:30 AM - 4 PM ET, Monday-Friday).

## Step 6: Deploy to Vercel

1. Push your code to GitHub (make sure `.env.local` is in `.gitignore`!)
2. Go to [https://vercel.com/](https://vercel.com/)
3. Click "Add New" → "Project"
4. Import your GitHub repository
5. In "Environment Variables", add all the variables from your `.env.local` file
6. Click "Deploy"

### Configure Cron Job Authorization

After deployment:

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Make sure `CRON_SECRET` is set
4. The cron job will automatically run every 15 minutes during market hours

## Troubleshooting

### "Failed to fetch account"
- Check your Alpaca API keys in `.env.local`
- Make sure you're using the Paper Trading keys
- Verify `ALPACA_BASE_URL` is set to `https://paper-api.alpaca.markets`

### "Failed to fetch watchlist"
- Check your Supabase connection
- Verify you ran the `supabase-schema.sql` script
- Check that all three Supabase environment variables are set correctly

### Bot not executing trades
- Make sure the bot is started (green "Running" indicator)
- Check that it's during market hours (9:30 AM - 4 PM ET, Mon-Fri)
- Verify you have tickers in your watchlist
- Check the "Last Error" message if any

### Cron job not running on Vercel
- Verify `vercel.json` is in your project root
- Check that `CRON_SECRET` environment variable is set in Vercel
- Cron jobs only run on production deployments, not preview deployments

## Next Steps

1. **Monitor Performance**: Watch the dashboard during market hours to see the bot in action
2. **Adjust Strategy**: Tweak the parameters based on performance
3. **Add More Tickers**: Build your watchlist with stocks you want to trade
4. **Backtest**: Review trade history to understand what's working
5. **Go Live**: When ready, switch to live trading (update Alpaca keys and set `paper: false` in `lib/alpaca.ts`)

## Important Reminders

⚠️ **Always test thoroughly with paper trading before using real money!**

- Start with small position sizes
- Monitor the bot closely for the first few days
- Understand that past performance doesn't guarantee future results
- Never invest more than you can afford to lose

## Support

If you encounter issues:
1. Check the browser console for errors (F12 → Console)
2. Check Vercel logs for server-side errors
3. Review the Supabase logs
4. Verify all environment variables are set correctly

