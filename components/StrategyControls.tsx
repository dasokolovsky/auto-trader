'use client'

import { useState, useEffect } from 'react'
import { StrategyConfig } from '@/types'

export default function StrategyControls() {
  const [strategy, setStrategy] = useState<StrategyConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [params, setParams] = useState({
    rsi_oversold: 30,
    rsi_overbought: 70,
    dip_percentage: 5,
    profit_target_percent: 8,
    stop_loss_percent: 3,
    max_positions: 5,
    position_size_usd: 1000,
    lookback_days: 20
  })

  useEffect(() => {
    fetchStrategy()
  }, [])

  const fetchStrategy = async () => {
    try {
      const res = await fetch('/api/strategy')
      const data = await res.json()
      if (data.strategy) {
        setStrategy(data.strategy)
        setParams(data.strategy.params)
      }
    } catch (error) {
      console.error('Error fetching strategy:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/strategy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ params })
      })

      if (res.ok) {
        const data = await res.json()
        setStrategy(data.strategy)
        alert('Strategy updated successfully!')
      }
    } catch (error) {
      console.error('Error updating strategy:', error)
      alert('Failed to update strategy')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Strategy Parameters
        </h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            RSI Oversold
          </label>
          <input
            type="number"
            value={params.rsi_oversold}
            onChange={(e) => setParams({ ...params, rsi_oversold: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Buy signal threshold</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            RSI Overbought
          </label>
          <input
            type="number"
            value={params.rsi_overbought}
            onChange={(e) => setParams({ ...params, rsi_overbought: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Sell signal threshold</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Dip Percentage (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={params.dip_percentage}
            onChange={(e) => setParams({ ...params, dip_percentage: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Min dip from high</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Profit Target (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={params.profit_target_percent}
            onChange={(e) => setParams({ ...params, profit_target_percent: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Take profit level</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Stop Loss (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={params.stop_loss_percent}
            onChange={(e) => setParams({ ...params, stop_loss_percent: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Max loss tolerance</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Max Positions
          </label>
          <input
            type="number"
            value={params.max_positions}
            onChange={(e) => setParams({ ...params, max_positions: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Concurrent positions</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Position Size ($)
          </label>
          <input
            type="number"
            step="100"
            value={params.position_size_usd}
            onChange={(e) => setParams({ ...params, position_size_usd: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Per position</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Lookback Days
          </label>
          <input
            type="number"
            value={params.lookback_days}
            onChange={(e) => setParams({ ...params, lookback_days: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">For dip calculation</p>
        </div>
      </div>
    </div>
  )
}

