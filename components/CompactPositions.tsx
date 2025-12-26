'use client'

import { useState, useEffect } from 'react'
import { AlpacaPosition } from '@/types'

export default function CompactPositions() {
  const [positions, setPositions] = useState<AlpacaPosition[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPositions()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPositions, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchPositions = async () => {
    try {
      const res = await fetch('/api/positions')
      const data = await res.json()
      setPositions(data.positions || [])
    } catch (error) {
      console.error('Error fetching positions:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Active Positions</h2>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  const totalPL = positions.reduce((sum, pos) => sum + parseFloat(pos.unrealized_pl), 0)
  const totalValue = positions.reduce((sum, pos) => sum + parseFloat(pos.market_value), 0)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Active Positions</h2>
        {positions.length > 0 && (
          <div className="text-right">
            <div className="text-xs text-gray-500 dark:text-gray-400">Total P/L</div>
            <div className={`text-lg font-bold ${totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalPL >= 0 ? '+' : ''}${totalPL.toFixed(2)}
            </div>
          </div>
        )}
      </div>

      {positions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">No active positions</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            Waiting for trading signals...
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {positions.map((position) => {
            const pl = parseFloat(position.unrealized_pl)
            const plPercent = parseFloat(position.unrealized_plpc) * 100
            const isProfit = pl >= 0
            const currentPrice = parseFloat(position.current_price)
            const entryPrice = parseFloat(position.avg_entry_price)
            const qty = parseFloat(position.qty)
            const marketValue = parseFloat(position.market_value)

            return (
              <div
                key={position.symbol}
                className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
              >
                <div className="flex items-center justify-between">
                  {/* Left: Symbol & Quantity */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {position.symbol}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {qty.toLocaleString()} shares
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Entry: </span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          ${entryPrice.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Current: </span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          ${currentPrice.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Value: </span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          ${marketValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: P/L */}
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                      {isProfit ? '+' : ''}${Math.abs(pl).toFixed(2)}
                    </div>
                    <div className={`text-lg font-semibold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                      {isProfit ? '+' : ''}{plPercent.toFixed(2)}%
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isProfit ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.abs(plPercent) * 10)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

