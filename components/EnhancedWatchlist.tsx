'use client'

import { useState, useEffect } from 'react'
import { WatchlistItem } from '@/types'

interface WatchlistWithSignal extends WatchlistItem {
  signal?: 'BUY' | 'SELL' | 'HOLD'
  signalStrength?: number
  lastPrice?: number
}

export default function EnhancedWatchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistWithSignal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newTicker, setNewTicker] = useState('')
  const [adding, setAdding] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    fetchWatchlist()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchWatchlist, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchWatchlist = async () => {
    try {
      setError(null)
      const res = await fetch('/api/watchlist')

      if (!res.ok) {
        throw new Error(`Failed to fetch watchlist: ${res.status}`)
      }

      const data = await res.json()

      // Set watchlist with default HOLD signal
      // (Signals will be added in a future update)
      const enhanced = (data.watchlist || []).map((item: WatchlistItem) => {
        return {
          ...item,
          signal: 'HOLD' as const,
          signalStrength: 0,
          lastPrice: 0
        }
      })

      setWatchlist(enhanced)
      setLastUpdate(new Date())
    } catch (error: any) {
      console.error('Error fetching watchlist:', error)
      setError(error.message || 'Failed to load watchlist')
    } finally {
      setLoading(false)
    }
  }

  const handleAddTicker = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTicker.trim()) return

    setAdding(true)
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: newTicker.toUpperCase() })
      })

      if (res.ok) {
        setNewTicker('')
        await fetchWatchlist()
      }
    } catch (error) {
      console.error('Error adding ticker:', error)
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveTicker = async (id: string) => {
    try {
      const res = await fetch(`/api/watchlist?id=${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        await fetchWatchlist()
      }
    } catch (error) {
      console.error('Error removing ticker:', error)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      {/* Header with Autonomous Badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Watchlist</h2>
          <div className="flex items-center gap-2 mt-1">
            <div className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs font-medium">
              🤖 AUTO-MANAGED
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Discovers stocks daily at 8 AM ET
            </span>
            {lastUpdate && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                • Updated {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchWatchlist}
            disabled={loading}
            className="px-3 py-1.5 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? '⟳' : '↻'} Refresh
          </button>
          <div className="text-right">
            <div className="text-xs text-gray-500 dark:text-gray-400">Stocks Monitored</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{watchlist.length}</div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="text-sm text-red-800 dark:text-red-400">
            ⚠️ {error}
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="text-xs text-blue-800 dark:text-blue-400">
          💡 <strong>How it works:</strong> The system automatically discovers profitable stocks daily and manages this list.
          You can manually add/remove stocks as overrides.
        </div>
      </div>

      {/* Add Ticker Form */}
      <form onSubmit={handleAddTicker} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTicker}
            onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
            placeholder="Add ticker (e.g., AAPL)"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={adding}
          />
          <button
            type="submit"
            disabled={adding || !newTicker.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {adding ? 'Adding...' : 'Add'}
          </button>
        </div>
      </form>

      {/* Watchlist Items */}
      {loading ? (
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      ) : watchlist.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-5xl mb-3">👀</div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">No tickers in watchlist</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Add stocks to monitor
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {watchlist.map((item) => {
            const signalColor = 
              item.signal === 'BUY' ? 'green' :
              item.signal === 'SELL' ? 'red' : 'gray'
            
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  {/* Ticker */}
                  <div className="font-bold text-lg text-gray-900 dark:text-white min-w-[60px]">
                    {item.ticker}
                  </div>
                  
                  {/* Signal Badge */}
                  <div className={`px-2 py-1 rounded text-xs font-bold ${
                    signalColor === 'green' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    signalColor === 'red' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                  }`}>
                    {item.signal || 'HOLD'}
                  </div>
                  
                  {/* Signal Strength */}
                  {item.signalStrength && item.signalStrength > 0 && (
                    <div className="flex-1">
                      <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            signalColor === 'green' ? 'bg-green-500' :
                            signalColor === 'red' ? 'bg-red-500' : 'bg-gray-500'
                          }`}
                          style={{ width: `${item.signalStrength * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => handleRemoveTicker(item.id)}
                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium ml-3"
                >
                  Remove
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

