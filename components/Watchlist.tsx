'use client'

import { useState, useEffect } from 'react'
import { WatchlistItem } from '@/types'

interface WatchlistProps {
  onUpdate?: () => void
}

export default function Watchlist({ onUpdate }: WatchlistProps) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newTicker, setNewTicker] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetchWatchlist()
  }, [])

  const fetchWatchlist = async () => {
    try {
      const res = await fetch('/api/watchlist')
      const data = await res.json()
      setWatchlist(data.watchlist || [])
    } catch (error) {
      console.error('Error fetching watchlist:', error)
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
        onUpdate?.()
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
        onUpdate?.()
      }
    } catch (error) {
      console.error('Error removing ticker:', error)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Watchlist
      </h2>

      {/* Add Ticker Form */}
      <form onSubmit={handleAddTicker} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTicker}
            onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
            placeholder="Add ticker (e.g., AAPL)"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={adding}
          />
          <button
            type="submit"
            disabled={adding || !newTicker.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {adding ? 'Adding...' : 'Add'}
          </button>
        </div>
      </form>

      {/* Watchlist Items */}
      {loading ? (
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      ) : watchlist.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
          No tickers in watchlist
        </p>
      ) : (
        <div className="space-y-2">
          {watchlist.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <span className="font-semibold text-gray-900 dark:text-white">
                {item.ticker}
              </span>
              <button
                onClick={() => handleRemoveTicker(item.id)}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

