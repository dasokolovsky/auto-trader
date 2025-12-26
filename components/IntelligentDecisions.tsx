'use client'

import { useEffect, useState } from 'react'

interface CleanupRecommendation {
  ticker: string
  shouldRemove: boolean
  reason: string
  performance: {
    score: number
    winRate: number
    totalProfit: number
    recentTrades: number
    status: string
  }
}

export default function IntelligentDecisions() {
  const [recommendations, setRecommendations] = useState<CleanupRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState(false)

  useEffect(() => {
    fetchRecommendations()
  }, [])

  const fetchRecommendations = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/intelligent/cleanup')
      const data = await res.json()
      setRecommendations(data.recommendations || [])
    } catch (error) {
      console.error('Failed to fetch recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const executeCleanup = async () => {
    if (!confirm('This will remove poor-performing tickers from your watchlist. Continue?')) {
      return
    }

    setExecuting(true)
    try {
      const res = await fetch('/api/intelligent/cleanup', { method: 'POST' })
      const data = await res.json()
      
      alert(`Cleanup complete! Removed ${data.count} tickers: ${data.removed.join(', ') || 'none'}`)
      fetchRecommendations() // Refresh
    } catch (error) {
      console.error('Failed to execute cleanup:', error)
      alert('Failed to execute cleanup')
    } finally {
      setExecuting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Analyzing watchlist...</div>
  }

  const toRemove = recommendations.filter(r => r.shouldRemove)
  const toKeep = recommendations.filter(r => !r.shouldRemove)

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Intelligent Watchlist Management</h3>
            <p className="text-sm text-gray-500">AI-powered decisions on what to keep and remove</p>
          </div>
          {toRemove.length > 0 && (
            <button
              onClick={executeCleanup}
              disabled={executing}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
            >
              {executing ? 'Removing...' : `Remove ${toRemove.length} Tickers`}
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded">
            <div className="text-2xl font-bold text-gray-700">{recommendations.length}</div>
            <div className="text-sm text-gray-500">Total Tickers</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded">
            <div className="text-2xl font-bold text-green-600">{toKeep.length}</div>
            <div className="text-sm text-gray-500">Keep</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded">
            <div className="text-2xl font-bold text-red-600">{toRemove.length}</div>
            <div className="text-sm text-gray-500">Remove</div>
          </div>
        </div>
      </div>

      {/* Recommendations to Remove */}
      {toRemove.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 bg-red-50 border-b border-red-200">
            <h3 className="font-semibold text-red-800">⚠️ Recommended for Removal</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {toRemove.map((rec) => (
              <div key={rec.ticker} className="px-4 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold">{rec.ticker}</span>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                        Score: {rec.performance.score.toFixed(0)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {rec.performance.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-red-600 font-medium">
                      {rec.reason}
                    </div>
                    <div className="mt-1 flex gap-4 text-xs text-gray-500">
                      <span>Win Rate: {rec.performance.winRate.toFixed(1)}%</span>
                      <span>Total P/L: ${rec.performance.totalProfit.toFixed(2)}</span>
                      <span>Trades: {rec.performance.recentTrades}</span>
                    </div>
                  </div>
                  <div className="text-2xl">🗑️</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations to Keep */}
      {toKeep.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 bg-green-50 border-b border-green-200">
            <h3 className="font-semibold text-green-800">✅ Keep These Tickers</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {toKeep.map((rec) => (
              <div key={rec.ticker} className="px-4 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold">{rec.ticker}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        rec.performance.score >= 70 ? 'bg-green-100 text-green-800' :
                        rec.performance.score >= 40 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        Score: {rec.performance.score.toFixed(0)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {rec.performance.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      {rec.reason}
                    </div>
                    <div className="mt-1 flex gap-4 text-xs text-gray-500">
                      <span>Win Rate: {rec.performance.winRate.toFixed(1)}%</span>
                      <span className={rec.performance.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                        Total P/L: ${rec.performance.totalProfit.toFixed(2)}
                      </span>
                      <span>Trades: {rec.performance.recentTrades}</span>
                    </div>
                  </div>
                  <div className="text-2xl">
                    {rec.performance.status === 'excellent' ? '🏆' : '✅'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

