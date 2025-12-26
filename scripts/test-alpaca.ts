#!/usr/bin/env node

/**
 * Test Alpaca API connection
 * This script verifies that Alpaca credentials are working
 */

import Alpaca from '@alpacahq/alpaca-trade-api'

async function testAlpacaConnection() {
  console.log('🧪 Testing Alpaca API Connection\n')
  
  // Check environment variables
  const apiKey = process.env.ALPACA_API_KEY
  const secretKey = process.env.ALPACA_SECRET_KEY
  const baseUrl = process.env.ALPACA_BASE_URL || 'https://paper-api.alpaca.markets'
  
  console.log('📋 Environment Variables:')
  console.log(`   ALPACA_API_KEY: ${apiKey ? '✅ SET (' + apiKey.substring(0, 8) + '...)' : '❌ MISSING'}`)
  console.log(`   ALPACA_SECRET_KEY: ${secretKey ? '✅ SET (' + secretKey.substring(0, 8) + '...)' : '❌ MISSING'}`)
  console.log(`   ALPACA_BASE_URL: ${baseUrl}`)
  console.log('')
  
  if (!apiKey || !secretKey) {
    console.error('❌ Missing Alpaca credentials!')
    console.error('Please set ALPACA_API_KEY and ALPACA_SECRET_KEY in .env.local')
    process.exit(1)
  }
  
  try {
    console.log('🔌 Connecting to Alpaca...')
    
    const alpaca = new Alpaca({
      keyId: apiKey,
      secretKey: secretKey,
      paper: true,
      usePolygon: false,
      baseUrl: baseUrl,
    })
    
    console.log('✅ Alpaca client created\n')
    
    // Test 1: Get Account
    console.log('📊 Test 1: Fetching account information...')
    try {
      const account = await alpaca.getAccount()
      console.log('✅ Account fetched successfully!')
      console.log(`   Equity: $${account.equity}`)
      console.log(`   Cash: $${account.cash}`)
      console.log(`   Buying Power: $${account.buying_power}`)
      console.log(`   Portfolio Value: $${account.portfolio_value}`)
      console.log('')
    } catch (error) {
      console.error('❌ Failed to fetch account')
      console.error('   Error:', error instanceof Error ? error.message : String(error))
      throw error
    }
    
    // Test 2: Get Positions
    console.log('📈 Test 2: Fetching positions...')
    try {
      const positions = await alpaca.getPositions()
      console.log(`✅ Positions fetched successfully! (${positions.length} positions)`)
      if (positions.length > 0) {
        positions.forEach((pos: any) => {
          console.log(`   ${pos.symbol}: ${pos.qty} shares @ $${pos.current_price}`)
        })
      } else {
        console.log('   No active positions')
      }
      console.log('')
    } catch (error) {
      console.error('❌ Failed to fetch positions')
      console.error('   Error:', error instanceof Error ? error.message : String(error))
      throw error
    }
    
    // Test 3: Check Market Status
    console.log('🕐 Test 3: Checking market status...')
    try {
      const clock = await alpaca.getClock()
      console.log('✅ Market status fetched successfully!')
      console.log(`   Market is: ${clock.is_open ? '🟢 OPEN' : '🔴 CLOSED'}`)
      console.log(`   Next open: ${clock.next_open}`)
      console.log(`   Next close: ${clock.next_close}`)
      console.log('')
    } catch (error) {
      console.error('❌ Failed to fetch market status')
      console.error('   Error:', error instanceof Error ? error.message : String(error))
      throw error
    }
    
    // Test 4: Get Orders
    console.log('📋 Test 4: Fetching orders...')
    try {
      const orders = await alpaca.getOrders({ status: 'all', limit: 5 })
      console.log(`✅ Orders fetched successfully! (${orders.length} recent orders)`)
      if (orders.length > 0) {
        orders.forEach((order: any) => {
          console.log(`   ${order.symbol}: ${order.side} ${order.qty} @ ${order.status}`)
        })
      } else {
        console.log('   No orders found')
      }
      console.log('')
    } catch (error) {
      console.error('❌ Failed to fetch orders')
      console.error('   Error:', error instanceof Error ? error.message : String(error))
      throw error
    }
    
    console.log('═══════════════════════════════════════════════════════════')
    console.log('✅ All Alpaca API tests passed!')
    console.log('═══════════════════════════════════════════════════════════')
    
  } catch (error) {
    console.log('')
    console.log('═══════════════════════════════════════════════════════════')
    console.log('❌ Alpaca API test failed!')
    console.log('═══════════════════════════════════════════════════════════')
    console.error('\nError details:')
    console.error(error)
    process.exit(1)
  }
}

// Run the test
testAlpacaConnection()

