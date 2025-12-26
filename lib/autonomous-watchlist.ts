/**
 * Autonomous Watchlist Manager
 * Automatically discovers, adds, and removes stocks from watchlist
 */

import { getServiceSupabase } from './supabase'
import { StockScreener } from './stock-screener'
import { IntelligentTrader } from './intelligent-trader'

interface WatchlistConfig {
  minWatchlistSize: number
  maxWatchlistSize: number
  minScoreToAdd: number
  daysWithoutTradeToRemove: number
}

export class AutonomousWatchlistManager {
  private supabase = getServiceSupabase()
  private screener = new StockScreener()
  private intelligentTrader = new IntelligentTrader()

  private readonly config: WatchlistConfig = {
    minWatchlistSize: 15,
    maxWatchlistSize: 30,
    minScoreToAdd: 60, // Only add stocks with score >= 60
    daysWithoutTradeToRemove: 14 // Remove if no trade in 14 days
  }

  /**
   * Get current watchlist size
   */
  async getWatchlistSize(): Promise<number> {
    const { data } = await this.supabase
      .from('watchlist')
      .select('*')
      .eq('is_active', true)

    return data?.length || 0
  }

  /**
   * Check if ticker is already in watchlist
   */
  async isInWatchlist(ticker: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('watchlist')
      .select('*')
      .eq('ticker', ticker)
      .eq('is_active', true)
      .single()

    return !!data
  }

  /**
   * Add ticker to watchlist
   */
  async addToWatchlist(ticker: string, reason: string): Promise<void> {
    await this.supabase
      .from('watchlist')
      .upsert({
        ticker,
        is_active: true,
        added_at: new Date().toISOString()
      }, {
        onConflict: 'ticker'
      })

    console.log(`✅ Added ${ticker} to watchlist: ${reason}`)
  }

  /**
   * Remove stale stocks (no trades in X days)
   */
  async removeStaleStocks(): Promise<{ removed: string[]; reasons: Record<string, string> }> {
    const { data: watchlist } = await this.supabase
      .from('watchlist')
      .select('*')
      .eq('is_active', true)

    if (!watchlist) return { removed: [], reasons: {} }

    const removed: string[] = []
    const reasons: Record<string, string> = {}
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - this.config.daysWithoutTradeToRemove)

    for (const item of watchlist) {
      // Check last trade for this ticker
      const { data: lastTrade } = await this.supabase
        .from('trades')
        .select('*')
        .eq('ticker', item.ticker)
        .order('executed_at', { ascending: false })
        .limit(1)
        .single()

      if (!lastTrade || new Date(lastTrade.executed_at) < cutoffDate) {
        await this.supabase
          .from('watchlist')
          .update({ is_active: false })
          .eq('id', item.id)

        removed.push(item.ticker)
        reasons[item.ticker] = `No trades in ${this.config.daysWithoutTradeToRemove} days - stale`
        console.log(`🗑️  Removed ${item.ticker}: ${reasons[item.ticker]}`)
      }
    }

    return { removed, reasons }
  }

  /**
   * Discover and add new stocks
   */
  async discoverAndAddStocks(): Promise<{ added: string[]; reasons: Record<string, string> }> {
    const currentSize = await this.getWatchlistSize()
    
    // If watchlist is at max, don't add more
    if (currentSize >= this.config.maxWatchlistSize) {
      console.log(`Watchlist at max size (${currentSize}/${this.config.maxWatchlistSize})`)
      return { added: [], reasons: {} }
    }

    // Calculate how many we can add
    const slotsAvailable = this.config.maxWatchlistSize - currentSize

    console.log(`🔍 Discovering new stocks (${slotsAvailable} slots available)...`)

    // Screen stocks
    const candidates = await this.screener.screenStocks({
      maxCandidates: slotsAvailable * 2 // Get 2x to have options
    })

    const added: string[] = []
    const reasons: Record<string, string> = {}

    for (const candidate of candidates) {
      if (added.length >= slotsAvailable) break

      // Check if already in watchlist
      if (await this.isInWatchlist(candidate.symbol)) {
        continue
      }

      // Only add if score is high enough
      if (candidate.score >= this.config.minScoreToAdd) {
        await this.addToWatchlist(candidate.symbol, candidate.reason)
        added.push(candidate.symbol)
        reasons[candidate.symbol] = `Score: ${candidate.score} - ${candidate.reason}`
      }
    }

    return { added, reasons }
  }

  /**
   * Full autonomous watchlist management
   * Run this daily to maintain optimal watchlist
   */
  async manageWatchlist(): Promise<{
    removed: string[]
    added: string[]
    poorPerformers: string[]
    stale: string[]
    newDiscoveries: string[]
  }> {
    console.log('🤖 Starting autonomous watchlist management...')

    // Step 1: Remove poor performers (using intelligent trader)
    const poorPerformersResult = await this.intelligentTrader.autoCleanupWatchlist()
    console.log(`📊 Removed ${poorPerformersResult.removed.length} poor performers`)

    // Step 2: Remove stale stocks (no trades in X days)
    const staleResult = await this.removeStaleStocks()
    console.log(`🧹 Removed ${staleResult.removed.length} stale stocks`)

    // Step 3: Check if we need to add new stocks
    const currentSize = await this.getWatchlistSize()
    console.log(`📈 Current watchlist size: ${currentSize}`)

    let newDiscoveries: string[] = []
    let newReasons: Record<string, string> = {}

    if (currentSize < this.config.minWatchlistSize) {
      console.log(`⚠️  Watchlist below minimum (${currentSize}/${this.config.minWatchlistSize})`)
      const discoveryResult = await this.discoverAndAddStocks()
      newDiscoveries = discoveryResult.added
      newReasons = discoveryResult.reasons
      console.log(`✨ Added ${newDiscoveries.length} new stocks`)
    } else {
      console.log(`✅ Watchlist size is healthy (${currentSize}/${this.config.minWatchlistSize}-${this.config.maxWatchlistSize})`)
    }

    // Summary
    const summary = {
      removed: [...poorPerformersResult.removed, ...staleResult.removed],
      added: newDiscoveries,
      poorPerformers: poorPerformersResult.removed,
      stale: staleResult.removed,
      newDiscoveries
    }

    console.log('\n📋 Watchlist Management Summary:')
    console.log(`  Removed: ${summary.removed.length} (${summary.poorPerformers.length} poor performers, ${summary.stale.length} stale)`)
    console.log(`  Added: ${summary.added.length} new discoveries`)
    console.log(`  Final size: ${await this.getWatchlistSize()}`)

    return summary
  }
}
