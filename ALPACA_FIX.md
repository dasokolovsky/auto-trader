# 🔧 Fix Alpaca API Error

## Problem Found

The error is: **"Invalid character in header content [\"APCA-API-KEY-ID\"]"**

This means the Alpaca API key stored in Vercel has invalid characters (likely from how it was added via command line).

## Solution

You need to **manually update the environment variables in the Vercel Dashboard** to avoid encoding issues.

### Step 1: Go to Vercel Dashboard

1. Open: https://vercel.com/warp-71426268/auto-trader/settings/environment-variables
2. You should see all your environment variables listed

### Step 2: Delete Old Alpaca Variables

Delete these 3 variables:
- `ALPACA_API_KEY`
- `ALPACA_SECRET_KEY`  
- `ALPACA_BASE_URL`

### Step 3: Add New Variables (Copy-Paste from Below)

**ALPACA_API_KEY**
```
PKTA522PH75BB2CDOWNZKN7S5P
```

**ALPACA_SECRET_KEY**
```
FnG4zCdspPV9Hnxc8JHsFDLbK2qS7dopn4hu2F9tj6wB
```

**ALPACA_BASE_URL**
```
https://paper-api.alpaca.markets
```

For each variable:
1. Click "Add New" button
2. Enter the variable name (e.g., `ALPACA_API_KEY`)
3. **Copy and paste** the value from above (don't type it)
4. Select environment: **Production** (and optionally Preview & Development)
5. Click "Save"

### Step 4: Redeploy

After adding all 3 variables, redeploy:

```bash
npx vercel --prod
```

### Step 5: Test

After deployment completes, test:

```bash
curl -s https://auto-trader-umber.vercel.app/api/account | jq .
```

You should see account data instead of an error!

---

## Alternative: Use Vercel CLI (If Dashboard Doesn't Work)

If you prefer CLI, here's the correct way:

```bash
# Remove old variables (answer 'y' to confirm)
npx vercel env rm ALPACA_API_KEY production
npx vercel env rm ALPACA_SECRET_KEY production
npx vercel env rm ALPACA_BASE_URL production

# Add new variables (paste value when prompted)
npx vercel env add ALPACA_API_KEY production
# When prompted, paste: PKTA522PH75BB2CDOWNZKN7S5P

npx vercel env add ALPACA_SECRET_KEY production
# When prompted, paste: FnG4zCdspPV9Hnxc8JHsFDLbK2qS7dopn4hu2F9tj6wB

npx vercel env add ALPACA_BASE_URL production
# When prompted, paste: https://paper-api.alpaca.markets

# Redeploy
npx vercel --prod
```

---

## Why This Happened

When you used `echo "value" | npx vercel env add`, the command might have included:
- Extra newline characters
- Shell escape characters
- Whitespace

By using the Vercel Dashboard or pasting when prompted, you avoid these encoding issues.

