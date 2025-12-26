'use client'

import { useState, useEffect } from 'react'
import { Trade } from '@/types'
import { formatDistanceToNow } from 'date-fns'

interface Activity {
  id: string
  type: 'trade' | 'decision' | 'watchlist'
  timestamp: string
  title: string
  description: string
  icon: string
  color: string
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivities()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchActivities, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchActivities = async () => {
    try {
      // Fetch recent trades
      const tradesRes = await fetch('/api/trades?limit=5')
      const tradesData = await tradesRes.json()
      const trades = tradesData.trades || []

      // Fetch recent intelligent decisions
      const decisionsRes = await fetch('/api/intelligent-decisions?limit=5')
      const decisionsData = await decisionsRes.json()
      const decisions = decisionsData.decisions || []

      // Combine and format activities
      const tradeActivities: Activity[] = trades.map((trade: Trade) => ({
        id: trade.id,
        type: 'trade' as const,
        timestamp: trade.executed_at,
        title: `${trade.side.toUpperCase()} ${trade.ticker}`,
        description: `${trade.quantity} shares @ $${trade.price.toFixed(2)} = $${trade.total_value.toFixed(2)}`,
        icon: trade.side === 'buy' ? '📈' : '📉',
        color: trade.side === 'buy' ? 'green' : 'red'
      }))

      const decisionActivities: Activity[] = decisions.map((decision: any) => ({
        id: decision.id,
        type: 'decision' as const,
        timestamp: decision.created_at,
        title: `${decision.action.toUpperCase()} Signal: ${decision.ticker}`,
        description: decision.reason.substring(0, 100) + (decision.reason.length > 100 ? '...' : ''),
        icon: decision.action === 'BUY' ? '🎯' : decision.action === 'SELL' ? '💰' : '👀',
        color: decision.action === 'BUY' ? 'blue' : decision.action === 'SELL' ? 'purple' : 'gray'
      }))

      // Combine and sort by timestamp
      const allActivities = [...tradeActivities, ...decisionActivities]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10)

      setActivities(allActivities)
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Activity</h2>

      {activities.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">No recent activity</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            Activity will appear here as the bot trades
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
            >
              {/* Icon */}
              <div className="text-2xl flex-shrink-0">
                {activity.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {activity.title}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                  {activity.description}
                </p>
              </div>

              {/* Type Badge */}
              <div className={`flex-shrink-0 px-2 py-1 rounded text-xs font-medium ${
                activity.color === 'green' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                activity.color === 'red' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                activity.color === 'blue' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                activity.color === 'purple' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
              }`}>
                {activity.type.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

