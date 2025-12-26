import { test, expect } from '@playwright/test';

/**
 * Smoke tests for production deployment
 * Run with: BASE_URL=https://auto-trader-umber.vercel.app npm run test:e2e
 */

const BASE_URL = process.env.BASE_URL || 'https://auto-trader-umber.vercel.app';

test.describe('Production Smoke Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    const response = await page.goto(BASE_URL);
    expect(response?.status()).toBe(200);
    
    // Check for main heading
    await expect(page.locator('text=Auto Trader Dashboard')).toBeVisible({ timeout: 10000 });
  });

  test('all critical sections are visible', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Trading Bot section
    await expect(page.locator('text=Trading Bot')).toBeVisible();
    
    // Active Positions section
    await expect(page.locator('text=Active Positions')).toBeVisible();
    
    // Watchlist section
    await expect(page.locator('text=Watchlist')).toBeVisible();
    
    // Enhanced Strategy section
    await expect(page.locator('text=Enhanced Strategy')).toBeVisible();
    
    // Strategy Parameters section
    await expect(page.locator('text=Strategy Parameters')).toBeVisible();
  });

  test('watchlist displays tickers', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Wait for watchlist to load
    await page.waitForSelector('text=Watchlist', { timeout: 10000 });
    
    // Check for at least one ticker (based on screenshot: NVDA, AAPL, TSLA)
    const tickers = ['NVDA', 'AAPL', 'TSLA'];
    let foundTicker = false;
    
    for (const ticker of tickers) {
      const tickerElement = page.locator(`text=${ticker}`).first();
      if (await tickerElement.isVisible().catch(() => false)) {
        foundTicker = true;
        break;
      }
    }
    
    expect(foundTicker).toBeTruthy();
  });

  test('bot status is displayed', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check for bot status indicator
    const runningStatus = page.locator('text=Running').first();
    const stoppedStatus = page.locator('text=Stopped').first();
    
    const hasStatus = await Promise.race([
      runningStatus.isVisible().catch(() => false),
      stoppedStatus.isVisible().catch(() => false)
    ]);
    
    expect(hasStatus).toBeTruthy();
  });

  test('enhanced strategy features are listed', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check for key strategy features
    await expect(page.locator('text=Volume Confirmation')).toBeVisible();
    await expect(page.locator('text=Trend Filter')).toBeVisible();
    await expect(page.locator('text=ATR-Based Stops')).toBeVisible();
  });

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Filter out known acceptable errors (like failed API calls during market close)
    const criticalErrors = errors.filter(error => 
      !error.includes('Failed to fetch') && 
      !error.includes('NetworkError')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('page is responsive', async ({ page }) => {
    // Test desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(BASE_URL);
    await expect(page.locator('text=Auto Trader Dashboard')).toBeVisible();
    
    // Test tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('text=Auto Trader Dashboard')).toBeVisible();
    
    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('text=Auto Trader Dashboard')).toBeVisible();
  });

  test('tabs are functional', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Find and click Analytics tab
    const analyticsTab = page.locator('text=Analytics').first();
    if (await analyticsTab.isVisible()) {
      await analyticsTab.click();
      await page.waitForTimeout(1000);
    }
    
    // Find and click Overview tab
    const overviewTab = page.locator('text=Overview').first();
    if (await overviewTab.isVisible()) {
      await overviewTab.click();
      await page.waitForTimeout(1000);
    }
    
    // Should still see main content
    await expect(page.locator('text=Active Positions')).toBeVisible();
  });

  test('all API endpoints respond', async ({ page }) => {
    const endpoints = [
      '/api/bot/status',
      '/api/watchlist',
      '/api/strategy',
      '/api/positions',
      '/api/trades'
    ];
    
    for (const endpoint of endpoints) {
      const response = await page.request.get(`${BASE_URL}${endpoint}`);
      expect(response.status()).toBeLessThan(500); // Should not have server errors
    }
  });
});

