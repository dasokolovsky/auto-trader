#!/bin/bash

# Simple deployment test script
# Tests the production deployment using curl

BASE_URL="${BASE_URL:-https://auto-trader-umber.vercel.app}"

echo "🧪 Testing Auto Trader Deployment"
echo "📍 Base URL: $BASE_URL"
echo ""

PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
  local name="$1"
  local endpoint="$2"
  local expected="$3"
  
  echo -n "Testing $name... "
  
  response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint" 2>&1)
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" = "200" ]; then
    if [ -n "$expected" ]; then
      if echo "$body" | grep -q "$expected"; then
        echo "✅ PASS"
        ((PASSED++))
      else
        echo "❌ FAIL (missing: $expected)"
        ((FAILED++))
      fi
    else
      echo "✅ PASS"
      ((PASSED++))
    fi
  else
    echo "❌ FAIL (HTTP $http_code)"
    ((FAILED++))
  fi
}

# Test homepage
test_endpoint "Homepage" "/" "Auto Trader"

# Test API endpoints
test_endpoint "Bot Status API" "/api/bot/status" "status"
test_endpoint "Watchlist API" "/api/watchlist" "watchlist"
test_endpoint "Strategy API" "/api/strategy" "strategy"
test_endpoint "Positions API" "/api/positions" "positions"
test_endpoint "Trades API" "/api/trades" "trades"

# Test specific content
echo -n "Testing Dashboard Title... "
if curl -s "$BASE_URL" | grep -q "Auto Trader Dashboard"; then
  echo "✅ PASS"
  ((PASSED++))
else
  echo "❌ FAIL"
  ((FAILED++))
fi

echo -n "Testing Trading Bot Section... "
if curl -s "$BASE_URL" | grep -q "Trading Bot"; then
  echo "✅ PASS"
  ((PASSED++))
else
  echo "❌ FAIL"
  ((FAILED++))
fi

echo -n "Testing Watchlist Section... "
if curl -s "$BASE_URL" | grep -q "Watchlist"; then
  echo "✅ PASS"
  ((PASSED++))
else
  echo "❌ FAIL"
  ((FAILED++))
fi

echo -n "Testing Enhanced Strategy Section... "
if curl -s "$BASE_URL" | grep -q "Enhanced Strategy"; then
  echo "✅ PASS"
  ((PASSED++))
else
  echo "❌ FAIL"
  ((FAILED++))
fi

# Test watchlist has tickers
echo -n "Testing Watchlist Has Tickers... "
watchlist_response=$(curl -s "$BASE_URL/api/watchlist")
if echo "$watchlist_response" | grep -q "NVDA\|AAPL\|TSLA"; then
  echo "✅ PASS"
  ((PASSED++))
else
  echo "❌ FAIL"
  ((FAILED++))
fi

# Test strategy has parameters
echo -n "Testing Strategy Has Parameters... "
strategy_response=$(curl -s "$BASE_URL/api/strategy")
if echo "$strategy_response" | grep -q "params"; then
  echo "✅ PASS"
  ((PASSED++))
else
  echo "❌ FAIL"
  ((FAILED++))
fi

# Print summary
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "📊 TEST SUMMARY"
echo "═══════════════════════════════════════════════════════════"
TOTAL=$((PASSED + FAILED))
echo "Total Tests: $TOTAL"
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"
echo "Success Rate: $(awk "BEGIN {printf \"%.1f\", ($PASSED/$TOTAL)*100}")%"
echo "═══════════════════════════════════════════════════════════"

if [ $FAILED -gt 0 ]; then
  exit 1
else
  echo "🎉 All tests passed!"
  exit 0
fi

