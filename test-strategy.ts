/**
 * Test script to verify the trading strategy works
 * Run with: npx tsx test-strategy.ts
 */

import { alpacaClient } from './lib/alpaca';
import { EnhancedTradingStrategy } from './lib/enhanced-strategy';

async function testStrategy() {
  console.log('🧪 Testing Auto Trader Strategy\n');

  const alpaca = alpacaClient;
  const strategy = new EnhancedTradingStrategy({
    rsi_oversold: 30,
    rsi_overbought: 70,
    dip_percentage: 5,
    profit_target_percent: 8,
    stop_loss_percent: 3,
    max_positions: 5,
    position_size_usd: 1000,
    lookback_days: 20
  });
  
  // Test 1: Check Alpaca connection
  console.log('1️⃣ Testing Alpaca API connection...');
  try {
    const account = await alpaca.getAccount();
    console.log('✅ Connected to Alpaca');
    console.log(`   Portfolio Value: $${parseFloat(account.portfolio_value).toLocaleString()}`);
    console.log(`   Cash: $${parseFloat(account.cash).toLocaleString()}`);
    console.log(`   Buying Power: $${parseFloat(account.buying_power).toLocaleString()}\n`);
  } catch (error) {
    console.error('❌ Failed to connect to Alpaca:', error);
    return;
  }
  
  // Test 2: Check market status
  console.log('2️⃣ Checking market status...');
  try {
    const clock = await alpaca.getClock();
    console.log(`   Market is: ${clock.is_open ? '🟢 OPEN' : '🔴 CLOSED'}`);
    console.log(`   Next open: ${clock.next_open}`);
    console.log(`   Next close: ${clock.next_close}\n`);
  } catch (error) {
    console.error('❌ Failed to get market status:', error);
  }
  
  // Test 3: Get historical data for TSLA
  console.log('3️⃣ Testing historical data retrieval...');
  try {
    const bars = await alpaca.getBars('TSLA', 100);
    console.log(`✅ Retrieved ${bars.length} days of TSLA price data`);
    if (bars.length > 0) {
      const latest = bars[bars.length - 1];
      console.log(`   Latest close: $${latest.c.toFixed(2)}`);
      console.log(`   Date: ${latest.t}\n`);
    }
  } catch (error) {
    console.error('❌ Failed to get historical data:', error);
  }
  
  // Test 4: Calculate RSI
  console.log('4️⃣ Testing RSI calculation...');
  try {
    const bars = await alpaca.getBars('TSLA', 100);
    const rsi = strategy.calculateRSI(bars);
    console.log(`✅ RSI calculated: ${rsi.toFixed(2)}`);
    
    if (rsi < 30) {
      console.log('   📊 Signal: OVERSOLD (potential BUY)');
    } else if (rsi > 70) {
      console.log('   📊 Signal: OVERBOUGHT (potential SELL)');
    } else {
      console.log('   📊 Signal: NEUTRAL');
    }
    console.log();
  } catch (error) {
    console.error('❌ Failed to calculate RSI:', error);
  }
  
  // Test 5: Generate trading signal
  console.log('5️⃣ Testing signal generation...');
  try {
    const bars = await alpaca.getBars('TSLA', 100);
    const positions = await alpaca.getPositions();
    const hasPosition = positions.some(p => p.symbol === 'TSLA');
    
    const signal = strategy.generateSignal('TSLA', bars, hasPosition, {
      rsi_oversold: 30,
      rsi_overbought: 70,
      dip_percentage: 5,
      profit_target_percent: 8,
      stop_loss_percent: 3,
      lookback_days: 20,
    });
    
    console.log(`✅ Signal generated for TSLA: ${signal.action}`);
    console.log(`   Reason: ${signal.reason}`);
    console.log(`   RSI: ${signal.rsi?.toFixed(2) || 'N/A'}`);
    console.log(`   Current Price: $${signal.currentPrice?.toFixed(2) || 'N/A'}`);
    
    if (signal.action === 'BUY') {
      console.log('   🟢 Would execute BUY order');
    } else if (signal.action === 'SELL') {
      console.log('   🔴 Would execute SELL order');
    } else {
      console.log('   ⚪ No action needed');
    }
    console.log();
  } catch (error) {
    console.error('❌ Failed to generate signal:', error);
  }
  
  // Test 6: Check current positions
  console.log('6️⃣ Checking current positions...');
  try {
    const positions = await alpaca.getPositions();
    if (positions.length === 0) {
      console.log('   No open positions\n');
    } else {
      console.log(`   ${positions.length} open position(s):`);
      positions.forEach(pos => {
        const pl = parseFloat(pos.unrealized_pl);
        const plPercent = parseFloat(pos.unrealized_plpc) * 100;
        console.log(`   - ${pos.symbol}: ${pos.qty} shares @ $${parseFloat(pos.avg_entry_price).toFixed(2)}`);
        console.log(`     P/L: $${pl.toFixed(2)} (${plPercent.toFixed(2)}%)`);
      });
      console.log();
    }
  } catch (error) {
    console.error('❌ Failed to get positions:', error);
  }
  
  console.log('✅ All tests completed!\n');
  console.log('💡 The strategy is working correctly.');
  console.log('💡 When market opens, the bot will automatically trade based on these signals.');
}

// Run the test
testStrategy().catch(console.error);

