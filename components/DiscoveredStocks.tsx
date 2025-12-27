'use client'

import { useState, useEffect } from 'react'

interface DiscoveredStock {
  ticker: string
  score: number
  reason: string
  price?: number
  volume?: number
  market_cap?: number
  added_to_watchlist: boolean
  discovered_at: string
}

export default function DiscoveredStocks() {
  const [stocks, setStocks] = useState<DiscoveredStock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastDiscovery, setLastDiscovery] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    fetchDiscoveredStocks()

    // Refresh every 30 seconds
    const interval = setInterval(fetchDiscoveredStocks, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchDiscoveredStocks = async () => {
    try {
      setError(null)
      const res = await fetch('/api/discovered-stocks')

      if (!res.ok) {
        throw new Error(`Failed to fetch discovered stocks: ${res.status}`)
      }

      const data = await res.json()
      setStocks(data.stocks || [])
      setLastDiscovery(data.lastDiscovery)
      setLastUpdate(new Date())
    } catch (error: any) {
      console.error('Error fetching discovered stocks:', error)
      setError(error.message || 'Failed to load discovered stocks')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Stock Discovery</h2>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Stock Discovery</h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Automatically screened stocks from market analysis
            </p>
            {lastUpdate && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                • Updated {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDiscoveredStocks}
            disabled={loading}
            className="px-3 py-1.5 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? '⟳' : '↻'} Refresh
          </button>
          {lastDiscovery && (
            <div className="text-right">
              <div className="text-xs text-gray-500 dark:text-gray-400">Last Discovery</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {new Date(lastDiscovery).toLocaleDateString()}
              </div>
            </div>
          )}
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

      {/* Status Banner */}
      <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="text-3xl">🔍</div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900 dark:text-white mb-1">
              Autonomous Stock Discovery
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              The system screens <strong>100+ stocks daily</strong> using technical analysis, 
              volume patterns, and trend filters. Top performers are automatically added to your watchlist.
            </div>
          </div>
        </div>
      </div>

      {/* Discovery Process */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="text-2xl mb-2">📊</div>
          <div className="font-semibold text-gray-900 dark:text-white mb-1">Screen</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Analyzes 100+ stocks from Yahoo Finance screeners
          </div>
        </div>
        
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="text-2xl mb-2">🎯</div>
          <div className="font-semibold text-gray-900 dark:text-white mb-1">Score</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Ranks by RSI, volume, trend, and momentum
          </div>
        </div>
        
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="text-2xl mb-2">✨</div>
          <div className="font-semibold text-gray-900 dark:text-white mb-1">Add</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Top 5-10 stocks added to watchlist automatically
          </div>
        </div>
      </div>

      {/* Discovered Stocks List */}
      {stocks.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-5xl mb-3">🌟</div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">No discoveries yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            Next discovery run: <strong>Tomorrow at 8 AM ET</strong>
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Or use the Cron Controls to run discovery manually
          </p>
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Found {stocks.length} stocks • {stocks.filter(s => s.added_to_watchlist).length} added to watchlist
            </div>
            {lastDiscovery && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(lastDiscovery).toLocaleString()}
              </div>
            )}
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {stocks.map((stock) => (
              <div
                key={stock.ticker}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  stock.added_to_watchlist
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="font-bold text-lg text-gray-900 dark:text-white">
                    {stock.ticker}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {stock.reason}
                    </div>
                    {stock.price && (
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                        ${stock.price.toFixed(2)} • Vol: {stock.volume ? (stock.volume / 1000000).toFixed(1) + 'M' : 'N/A'}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Score</div>
                    <div className={`text-lg font-bold ${
                      stock.score >= 80 ? 'text-green-600' :
                      stock.score >= 60 ? 'text-blue-600' :
                      'text-gray-600'
                    }`}>
                      {stock.score.toFixed(0)}
                    </div>
                  </div>
                  {stock.added_to_watchlist && (
                    <div className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs font-medium">
                      ✓ Added
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

