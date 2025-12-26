#!/usr/bin/env tsx

/**
 * Simple frontend health check script
 * Tests the production deployment without Playwright
 */

const BASE_URL = process.env.BASE_URL || 'https://auto-trader-umber.vercel.app';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>): Promise<void> {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, passed: true, duration: Date.now() - start });
    console.log(`✅ ${name}`);
  } catch (error) {
    results.push({ 
      name, 
      passed: false, 
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - start 
    });
    console.log(`❌ ${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function fetchJSON(endpoint: string): Promise<any> {
  const response = await fetch(`${BASE_URL}${endpoint}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

async function fetchHTML(endpoint: string = '/'): Promise<string> {
  const response = await fetch(`${BASE_URL}${endpoint}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.text();
}

async function runTests() {
  console.log('🧪 Testing Auto Trader Frontend');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log('');

  // Test 1: Homepage loads
  await test('Homepage loads successfully', async () => {
    const html = await fetchHTML();
    if (!html.includes('Auto Trader')) {
      throw new Error('Page does not contain "Auto Trader"');
    }
  });

  // Test 2: Dashboard title present
  await test('Dashboard title is present', async () => {
    const html = await fetchHTML();
    if (!html.includes('Auto Trader Dashboard')) {
      throw new Error('Dashboard title not found');
    }
  });

  // Test 3: Bot status API
  await test('Bot status API responds', async () => {
    const data = await fetchJSON('/api/bot/status');
    if (!data.status) {
      throw new Error('No status in response');
    }
  });

  // Test 4: Watchlist API
  await test('Watchlist API responds', async () => {
    const data = await fetchJSON('/api/watchlist');
    if (!data.watchlist) {
      throw new Error('No watchlist in response');
    }
  });

  // Test 5: Strategy API
  await test('Strategy API responds', async () => {
    const data = await fetchJSON('/api/strategy');
    if (!data.strategy) {
      throw new Error('No strategy in response');
    }
  });

  // Test 6: Positions API
  await test('Positions API responds', async () => {
    const data = await fetchJSON('/api/positions');
    if (!data.positions) {
      throw new Error('No positions in response');
    }
  });

  // Test 7: Trades API
  await test('Trades API responds', async () => {
    const data = await fetchJSON('/api/trades');
    if (!data.trades) {
      throw new Error('No trades in response');
    }
  });

  // Test 8: Watchlist has tickers
  await test('Watchlist contains tickers', async () => {
    const data = await fetchJSON('/api/watchlist');
    if (!Array.isArray(data.watchlist) || data.watchlist.length === 0) {
      throw new Error('Watchlist is empty');
    }
  });

  // Test 9: Strategy has parameters
  await test('Strategy has parameters', async () => {
    const data = await fetchJSON('/api/strategy');
    if (!data.strategy.params) {
      throw new Error('Strategy has no parameters');
    }
  });

  // Test 10: HTML contains key sections
  await test('HTML contains Trading Bot section', async () => {
    const html = await fetchHTML();
    if (!html.includes('Trading Bot')) {
      throw new Error('Trading Bot section not found');
    }
  });

  await test('HTML contains Watchlist section', async () => {
    const html = await fetchHTML();
    if (!html.includes('Watchlist')) {
      throw new Error('Watchlist section not found');
    }
  });

  await test('HTML contains Enhanced Strategy section', async () => {
    const html = await fetchHTML();
    if (!html.includes('Enhanced Strategy')) {
      throw new Error('Enhanced Strategy section not found');
    }
  });

  // Print summary
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  
  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('');
    console.log('Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  ❌ ${r.name}: ${r.error}`);
    });
  }
  
  console.log('═══════════════════════════════════════════════════════════');
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

