'use client'

import { useState, useEffect } from 'react'

interface Metrics {
  totalReturn: number
  winRate: number
  sharpeRatio: number
  maxDrawdown: number
  profitFactor: number
  totalTrades: number
}

export default function PerformanceMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchMetrics, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/analytics/performance?days=30')
      const data = await res.json()
      
      setMetrics({
        totalReturn: data.performance?.portfolioReturn || 0,
        winRate: data.performance?.winRate || 0,
        sharpeRatio: data.performance?.sharpeRatio || 0,
        maxDrawdown: data.performance?.maxDrawdownPercent || 0,
        profitFactor: data.performance?.profitFactor || 0,
        totalTrades: data.trades?.completed || 0
      })
    } catch (error) {
      console.error('Error fetching metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Performance Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!metrics) return null

  const metricCards = [
    {
      label: 'Total Return',
      value: `${metrics.totalReturn >= 0 ? '+' : ''}${metrics.totalReturn.toFixed(2)}%`,
      color: metrics.totalReturn >= 0 ? 'green' : 'red',
      icon: '📈',
      status: metrics.totalReturn >= 5 ? '✅ Excellent' : metrics.totalReturn >= 0 ? '✅ Good' : '⚠️ Negative'
    },
    {
      label: 'Win Rate',
      value: `${metrics.winRate.toFixed(1)}%`,
      color: metrics.winRate >= 60 ? 'green' : metrics.winRate >= 50 ? 'blue' : 'yellow',
      icon: '🎯',
      status: metrics.winRate >= 60 ? '✅ Excellent' : metrics.winRate >= 50 ? '✅ Good' : '⚠️ Fair'
    },
    {
      label: 'Sharpe Ratio',
      value: metrics.sharpeRatio.toFixed(2),
      color: metrics.sharpeRatio >= 1.5 ? 'green' : metrics.sharpeRatio >= 1.0 ? 'blue' : 'yellow',
      icon: '⚡',
      status: metrics.sharpeRatio >= 1.5 ? '✅ Excellent' : metrics.sharpeRatio >= 1.0 ? '✅ Good' : '⚠️ Fair'
    },
    {
      label: 'Max Drawdown',
      value: `${metrics.maxDrawdown.toFixed(2)}%`,
      color: metrics.maxDrawdown <= 15 ? 'green' : metrics.maxDrawdown <= 25 ? 'yellow' : 'red',
      icon: '📉',
      status: metrics.maxDrawdown <= 15 ? '✅ Good' : metrics.maxDrawdown <= 25 ? '⚠️ Fair' : '❌ High'
    },
    {
      label: 'Profit Factor',
      value: metrics.profitFactor === 999 ? '∞' : metrics.profitFactor.toFixed(2),
      color: metrics.profitFactor >= 2.0 ? 'green' : metrics.profitFactor >= 1.5 ? 'blue' : 'yellow',
      icon: '💪',
      status: metrics.profitFactor >= 2.0 ? '✅ Excellent' : metrics.profitFactor >= 1.5 ? '✅ Good' : '⚠️ Fair'
    },
    {
      label: 'Total Trades',
      value: metrics.totalTrades.toString(),
      color: 'gray',
      icon: '📊',
      status: `${metrics.totalTrades} completed`
    }
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Performance Metrics (30 Days)</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {metricCards.map((metric, index) => (
          <div
            key={index}
            className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{metric.icon}</span>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {metric.label}
              </div>
            </div>
            <div className={`text-2xl font-bold mb-1 ${
              metric.color === 'green' ? 'text-green-600' :
              metric.color === 'red' ? 'text-red-600' :
              metric.color === 'blue' ? 'text-blue-600' :
              metric.color === 'yellow' ? 'text-yellow-600' :
              'text-gray-700 dark:text-gray-300'
            }`}>
              {metric.value}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {metric.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

