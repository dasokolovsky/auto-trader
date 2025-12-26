/**
 * Test Stock Discovery System
 * Manually triggers the manage-watchlist cron to see what stocks it discovers
 */

async function testDiscovery() {
  console.log('🔍 Testing Stock Discovery System...\n')

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  try {
    console.log('📡 Triggering manage-watchlist cron...')
    
    const response = await fetch(`${baseUrl}/api/admin/trigger-cron`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cronJob: 'manage-watchlist' })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Error:', data)
      return
    }

    console.log('\n✅ Success!\n')
    console.log('📊 Results:')
    console.log(JSON.stringify(data, null, 2))

    // Parse the results
    const result = data.result?.result
    if (result) {
      console.log('\n📈 Summary:')
      console.log(`  Removed (poor performers): ${result.poorPerformers?.length || 0}`)
      console.log(`  Removed (stale): ${result.stale?.length || 0}`)
      console.log(`  Added (new discoveries): ${result.newDiscoveries?.length || 0}`)
      
      if (result.newDiscoveries?.length > 0) {
        console.log('\n✨ New Stocks Discovered:')
        result.newDiscoveries.forEach((ticker: string) => {
          console.log(`  - ${ticker}`)
        })
      }
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message)
  }
}

testDiscovery()

