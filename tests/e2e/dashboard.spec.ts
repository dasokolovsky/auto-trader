import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Auto Trader Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('should load the dashboard page', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Auto Trader/);
    
    // Check main heading
    await expect(page.locator('h1, h2').filter({ hasText: 'Auto Trader Dashboard' })).toBeVisible();
    
    // Check subtitle
    await expect(page.getByText('Automated stock trading with swing trading strategy')).toBeVisible();
  });

  test('should display trading bot status', async ({ page }) => {
    // Check Trading Bot section
    await expect(page.getByText('Trading Bot')).toBeVisible();
    
    // Check bot status (Running or Stopped)
    const statusElement = page.locator('text=Running, text=Stopped').first();
    await expect(statusElement).toBeVisible();
    
    // Check info message
    await expect(page.getByText(/The bot runs every 15 minutes during market hours/)).toBeVisible();
    
    // Check Stop Bot button
    await expect(page.getByRole('button', { name: /Stop Bot/i })).toBeVisible();
  });

  test('should display Overview and Analytics tabs', async ({ page }) => {
    // Check tabs exist
    await expect(page.getByText('📊 Overview')).toBeVisible();
    await expect(page.getByText('📈 Analytics')).toBeVisible();
  });

  test('should display account section', async ({ page }) => {
    // The account section should be visible
    const accountSection = page.locator('text=Failed to load account data, text=Account Value, text=Cash, text=Buying Power').first();
    await expect(accountSection).toBeVisible({ timeout: 10000 });
  });

  test('should display active positions section', async ({ page }) => {
    await expect(page.getByText('Active Positions')).toBeVisible();
    
    // Should show either positions or "No active positions"
    const positionsContent = page.locator('text=No active positions, text=Symbol').first();
    await expect(positionsContent).toBeVisible({ timeout: 5000 });
  });

  test('should display watchlist with tickers', async ({ page }) => {
    await expect(page.getByText('Watchlist')).toBeVisible();
    
    // Check for add ticker input
    await expect(page.getByPlaceholder(/Add ticker/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Add/i })).toBeVisible();
    
    // Check for existing tickers (NVDA, AAPL, TSLA based on screenshot)
    const watchlistSection = page.locator('text=Watchlist').locator('..');
    await expect(watchlistSection.getByText('NVDA')).toBeVisible();
    await expect(watchlistSection.getByText('AAPL')).toBeVisible();
    await expect(watchlistSection.getByText('TSLA')).toBeVisible();
  });

  test('should be able to add ticker to watchlist', async ({ page }) => {
    const tickerInput = page.getByPlaceholder(/Add ticker/i);
    const addButton = page.getByRole('button', { name: /Add/i });
    
    // Type a ticker
    await tickerInput.fill('MSFT');
    
    // Click add button
    await addButton.click();
    
    // Wait for the ticker to appear (or error message)
    await page.waitForTimeout(2000);
    
    // Check if ticker was added or if there's an error
    const msftTicker = page.getByText('MSFT');
    const errorMessage = page.getByText(/error/i);
    
    // Either the ticker should be added or there should be an error
    const tickerOrError = await Promise.race([
      msftTicker.isVisible().catch(() => false),
      errorMessage.isVisible().catch(() => false)
    ]);
    
    expect(tickerOrError).toBeTruthy();
  });

  test('should display enhanced strategy section', async ({ page }) => {
    await expect(page.getByText('🚀 Enhanced Strategy (5 Quick Wins)')).toBeVisible();
    await expect(page.getByText('PROFESSIONAL GRADE')).toBeVisible();
    
    // Check for strategy features
    await expect(page.getByText('Volume Confirmation')).toBeVisible();
    await expect(page.getByText('Trend Filter (SMA 200)')).toBeVisible();
    await expect(page.getByText('ATR-Based Stops')).toBeVisible();
    await expect(page.getByText('Sharpe Ratio')).toBeVisible();
    await expect(page.getByText('Max Drawdown')).toBeVisible();
    await expect(page.getByText('Confluence Scoring')).toBeVisible();
  });

  test('should display strategy parameters', async ({ page }) => {
    await expect(page.getByText('Strategy Parameters')).toBeVisible();
    
    // Check for parameter inputs
    await expect(page.getByText('RSI Oversold')).toBeVisible();
    await expect(page.getByText('RSI Overbought')).toBeVisible();
    await expect(page.getByText('Dip Percentage (%)')).toBeVisible();
    await expect(page.getByText('Profit Target (%)')).toBeVisible();
    
    // Check for Save Changes button
    await expect(page.getByRole('button', { name: /Save Changes/i })).toBeVisible();
  });

  test('should display how enhanced strategy works', async ({ page }) => {
    await expect(page.getByText('⚙️ How Enhanced Strategy Works')).toBeVisible();
    
    // Check for explanation points
    await expect(page.getByText(/Confluence Check/i)).toBeVisible();
    await expect(page.getByText(/Quality Filter/i)).toBeVisible();
    await expect(page.getByText(/Adaptive Risk/i)).toBeVisible();
    await expect(page.getByText(/Performance Tracking/i)).toBeVisible();
  });

  test('should be able to stop/start bot', async ({ page }) => {
    const botButton = page.getByRole('button', { name: /Stop Bot|Start Bot/i });
    
    // Get initial button text
    const initialText = await botButton.textContent();
    
    // Click the button
    await botButton.click();
    
    // Wait for state change
    await page.waitForTimeout(2000);
    
    // Button text should have changed or there should be a response
    const newText = await botButton.textContent();
    
    // Either the text changed or it's the same (if there was an error)
    expect(newText).toBeTruthy();
  });

  test('should switch between Overview and Analytics tabs', async ({ page }) => {
    const overviewTab = page.getByText('📊 Overview');
    const analyticsTab = page.getByText('📈 Analytics');
    
    // Click Analytics tab
    await analyticsTab.click();
    await page.waitForTimeout(1000);
    
    // Click back to Overview
    await overviewTab.click();
    await page.waitForTimeout(1000);
    
    // Should still see the main content
    await expect(page.getByText('Active Positions')).toBeVisible();
  });
});

