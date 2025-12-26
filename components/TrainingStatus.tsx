'use client'

import { useEffect, useState } from 'react'

interface TrainingData {
  ticker: string
  hasData: boolean
  totalTrades?: number
  wins?: number
  losses?: number
  winRate?: number
  totalProfit?: number
  score?: number
}

export default function TrainingStatus() {
  const [trainedTickers, setTrainedTickers] = useState<TrainingData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrainingStatus()
  }, [])

  const fetchTrainingStatus = async () => {
    setLoading(true)
    try {
      // Get watchlist tickers
      const watchlistRes = await fetch('/api/watchlist')
      const watchlistData = await watchlistRes.json()
      
      if (!watchlistData.watchlist) {
        setLoading(false)
        return
      }
      
      // Check training status for each ticker
      const results = await Promise.all(
        watchlistData.watchlist.map(async (item: any) => {
          try {
            const res = await fetch(`/api/backtest/run?ticker=${item.ticker}`)
            const data = await res.json()
            return data
          } catch {
            return { ticker: item.ticker, hasData: false }
          }
        })
      )
      
      setTrainedTickers(results)
    } catch (error) {
      console.error('Failed to fetch training status:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-4">Checking training status...</div>
  }

  const trained = trainedTickers.filter(t => t.hasData)
  const untrained = trainedTickers.filter(t => !t.hasData)

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">🎓 Training Status</h3>
          <p className="text-sm text-gray-500">Pre-trained knowledge from backtesting</p>
        </div>
        {untrained.length > 0 && (
          <div className="text-sm text-orange-600">
            ⚠️ {untrained.length} ticker{untrained.length > 1 ? 's' : ''} not trained
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-gray-50 rounded">
          <div className="text-2xl font-bold text-gray-700">{trainedTickers.length}</div>
          <div className="text-sm text-gray-500">Total Tickers</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded">
          <div className="text-2xl font-bold text-green-600">{trained.length}</div>
          <div className="text-sm text-gray-500">Trained</div>
        </div>
        <div className="text-center p-4 bg-orange-50 rounded">
          <div className="text-2xl font-bold text-orange-600">{untrained.length}</div>
          <div className="text-sm text-gray-500">Untrained</div>
        </div>
      </div>

      {trained.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium mb-2">✅ Trained Tickers</h4>
          <div className="space-y-2">
            {trained.map((ticker) => (
              <div key={ticker.ticker} className="flex items-center justify-between p-3 bg-green-50 rounded">
                <div className="flex items-center gap-3">
                  <span className="font-bold">{ticker.ticker}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    (ticker.score || 0) >= 70 ? 'bg-green-100 text-green-800' :
                    (ticker.score || 0) >= 40 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    Score: {ticker.score?.toFixed(0) || 0}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {ticker.totalTrades} trades | {ticker.winRate?.toFixed(1)}% win rate
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {untrained.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">⚠️ Untrained Tickers</h4>
          <div className="space-y-2">
            {untrained.map((ticker) => (
              <div key={ticker.ticker} className="flex items-center justify-between p-3 bg-orange-50 rounded">
                <div className="flex items-center gap-3">
                  <span className="font-bold">{ticker.ticker}</span>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
                    No backtest data
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  Will learn from live trades
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> Run <code className="bg-blue-100 px-2 py-1 rounded">node train-system.js</code> to pre-train these tickers with historical data.
            </p>
          </div>
        </div>
      )}

      {trainedTickers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-2">No tickers in watchlist</p>
          <p className="text-sm">Add tickers to see training status</p>
        </div>
      )}
    </div>
  )
}

