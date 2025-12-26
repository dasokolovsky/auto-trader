'use client'

import { useEffect, useState } from 'react'

interface TickerPerformance {
  ticker: string
  totalTrades: number
  wins: number
  losses: number
  winRate: number
  totalProfit: number
  profitPerTrade: number
  totalSignals: number
  executionRate: number
  score: number
}

interface TickerRecommendation {
  ticker: string
  score: number
  signal: string
  reason: string
  rsi?: number
  currentPrice?: number
  dipPercentage?: number
  historicalWinner: boolean
  recommendation: string
}

export default function TickerRecommendations() {
  const [performance, setPerformance] = useState<TickerPerformance[]>([])
  const [recommendations, setRecommendations] = useState<TickerRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'performance' | 'recommendations'>('performance')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [perfRes, recRes] = await Promise.all([
        fetch('/api/analytics/ticker-performance?days=30'),
        fetch('/api/analytics/recommend-tickers?limit=10')
      ])
      
      const perfData = await perfRes.json()
      const recData = await recRes.json()
      
      setPerformance(perfData.tickers || [])
      setRecommendations(recData.recommendations || [])
    } catch (error) {
      console.error('Failed to fetch ticker data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addToWatchlist = async (ticker: string) => {
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker })
      })
      
      if (res.ok) {
        alert(`${ticker} added to watchlist!`)
        fetchData() // Refresh to remove from recommendations
      }
    } catch (error) {
      console.error('Failed to add to watchlist:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Analyzing tickers...</div>
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('performance')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'performance'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📊 Current Performance
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'recommendations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            🎯 Recommendations
          </button>
        </nav>
      </div>

      {activeTab === 'performance' ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b">
            <h3 className="font-semibold">Ticker Performance (Last 30 Days)</h3>
            <p className="text-sm text-gray-500">Ranked by overall score</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Rank</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Ticker</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Score</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Win Rate</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Profit/Trade</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total P/L</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Trades</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Signals</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {performance.map((ticker, index) => (
                  <tr key={ticker.ticker} className={index < 3 ? 'bg-green-50' : ''}>
                    <td className="px-4 py-2 text-sm">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                    </td>
                    <td className="px-4 py-2 text-sm font-bold">{ticker.ticker}</td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        ticker.score >= 70 ? 'bg-green-100 text-green-800' :
                        ticker.score >= 40 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {ticker.score.toFixed(0)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm">{ticker.winRate.toFixed(1)}%</td>
                    <td className={`px-4 py-2 text-sm font-medium ${ticker.profitPerTrade >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${ticker.profitPerTrade.toFixed(2)}
                    </td>
                    <td className={`px-4 py-2 text-sm ${ticker.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${ticker.totalProfit.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-sm">{ticker.wins + ticker.losses}</td>
                    <td className="px-4 py-2 text-sm">{ticker.totalSignals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b">
            <h3 className="font-semibold">Recommended Tickers to Add</h3>
            <p className="text-sm text-gray-500">Based on current market conditions and historical performance</p>
          </div>
          <div className="divide-y divide-gray-200">
            {recommendations.map((rec) => (
              <div key={rec.ticker} className="px-4 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold">{rec.ticker}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        rec.recommendation === 'Strong Buy' ? 'bg-green-100 text-green-800' :
                        rec.recommendation === 'Consider' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {rec.recommendation}
                      </span>
                      <span className="text-sm text-gray-500">Score: {rec.score}</span>
                      {rec.historicalWinner && <span className="text-xs">🏆 Past Winner</span>}
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      {rec.reason}
                    </div>
                    <div className="mt-1 flex gap-4 text-xs text-gray-500">
                      {rec.rsi && <span>RSI: {rec.rsi.toFixed(1)}</span>}
                      {rec.currentPrice && <span>Price: ${rec.currentPrice.toFixed(2)}</span>}
                      {rec.dipPercentage && <span>Dip: {rec.dipPercentage.toFixed(1)}%</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => addToWatchlist(rec.ticker)}
                    className="ml-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                  >
                    Add to Watchlist
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

