'use client'

import { useEffect, useState } from 'react'
import TickerRecommendations from './TickerRecommendations'
import IntelligentDecisions from './IntelligentDecisions'
import TrainingStatus from './TrainingStatus'

interface AnalyticsData {
  period: {
    days: number
    startDate: string
    endDate: string
  }
  activity: {
    totalExecutions: number
    totalSignals: number
    signalsExecuted: number
    executionRate: number
  }
  trades: {
    total: number
    buys: number
    sells: number
    completed: number
  }
  performance: {
    totalProfit: number
    winRate: number
    winners: number
    losers: number
    avgProfit: number
    bestTrade: number
    worstTrade: number
    portfolioReturn: number
    // ENHANCED METRICS
    sharpeRatio: number
    maxDrawdown: number
    maxDrawdownPercent: number
    profitFactor: number
    expectancy: number
    avgWin: number
    avgLoss: number
  }
  completedTrades: Array<{
    ticker: string
    buyDate: string
    sellDate: string
    profit: number
    profitPercent: number
    buyReason: string
    sellReason: string
  }>
}

export default function AnalyticsDashboard() {
  const [days, setDays] = useState(7)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [days])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/analytics/performance?days=${days}`)
      const json = await res.json()
      setData(json)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>
  }

  if (!data) {
    return <div className="text-center py-8 text-red-500">Failed to load analytics</div>
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex gap-2">
        {[1, 7, 30].map(d => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-4 py-2 rounded ${
              days === d
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {d === 1 ? 'Today' : `${d} Days`}
          </button>
        ))}
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Total P/L</div>
          <div className={`text-2xl font-bold ${data.performance.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${data.performance.totalProfit.toFixed(2)}
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Win Rate</div>
          <div className="text-2xl font-bold text-blue-600">
            {data.performance.winRate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">
            {data.performance.winners}W / {data.performance.losers}L
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Total Trades</div>
          <div className="text-2xl font-bold text-gray-700">
            {data.trades.completed}
          </div>
          <div className="text-xs text-gray-500">
            {data.trades.buys} buys / {data.trades.sells} sells
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Signal Rate</div>
          <div className="text-2xl font-bold text-purple-600">
            {data.activity.executionRate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">
            {data.activity.signalsExecuted} / {data.activity.totalSignals} executed
          </div>
        </div>
      </div>

      {/* ENHANCED METRICS - Quick Wins */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg shadow-lg border-2 border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">🚀</span>
          Enhanced Performance Metrics (Quick Wins)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Sharpe Ratio */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500 flex items-center">
              Sharpe Ratio
              <span className="ml-1 text-xs text-blue-500" title="Risk-adjusted returns. >1.5 is excellent, >1.0 is good">ⓘ</span>
            </div>
            <div className={`text-2xl font-bold ${
              data.performance.sharpeRatio >= 1.5 ? 'text-green-600' :
              data.performance.sharpeRatio >= 1.0 ? 'text-blue-600' :
              data.performance.sharpeRatio >= 0 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {data.performance.sharpeRatio.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {data.performance.sharpeRatio >= 1.5 ? '✅ Excellent' :
               data.performance.sharpeRatio >= 1.0 ? '✅ Good' :
               data.performance.sharpeRatio >= 0 ? '⚠️ Fair' : '❌ Poor'}
            </div>
          </div>

          {/* Max Drawdown */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500 flex items-center">
              Max Drawdown
              <span className="ml-1 text-xs text-blue-500" title="Worst peak-to-trough decline. <15% is good, <25% is acceptable">ⓘ</span>
            </div>
            <div className={`text-2xl font-bold ${
              data.performance.maxDrawdownPercent <= 15 ? 'text-green-600' :
              data.performance.maxDrawdownPercent <= 25 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {data.performance.maxDrawdownPercent.toFixed(2)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              ${data.performance.maxDrawdown.toFixed(2)} loss
            </div>
          </div>

          {/* Profit Factor */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500 flex items-center">
              Profit Factor
              <span className="ml-1 text-xs text-blue-500" title="Gross profit / Gross loss. >2.0 is excellent, >1.5 is good">ⓘ</span>
            </div>
            <div className={`text-2xl font-bold ${
              data.performance.profitFactor >= 2.0 ? 'text-green-600' :
              data.performance.profitFactor >= 1.5 ? 'text-blue-600' :
              data.performance.profitFactor >= 1.0 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {data.performance.profitFactor === 999 ? '∞' : data.performance.profitFactor.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {data.performance.profitFactor >= 2.0 ? '✅ Excellent' :
               data.performance.profitFactor >= 1.5 ? '✅ Good' :
               data.performance.profitFactor >= 1.0 ? '⚠️ Fair' : '❌ Poor'}
            </div>
          </div>

          {/* Expectancy */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500 flex items-center">
              Expectancy
              <span className="ml-1 text-xs text-blue-500" title="Average $ per trade. Higher is better">ⓘ</span>
            </div>
            <div className={`text-2xl font-bold ${
              data.performance.expectancy >= 50 ? 'text-green-600' :
              data.performance.expectancy >= 0 ? 'text-blue-600' : 'text-red-600'
            }`}>
              ${data.performance.expectancy.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              per trade
            </div>
          </div>
        </div>

        {/* Win/Loss Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500 mb-2">Average Win vs Loss</div>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs text-gray-500">Avg Win</div>
                <div className="text-lg font-bold text-green-600">${data.performance.avgWin.toFixed(2)}</div>
              </div>
              <div className="text-2xl text-gray-400">vs</div>
              <div>
                <div className="text-xs text-gray-500">Avg Loss</div>
                <div className="text-lg font-bold text-red-600">${data.performance.avgLoss.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Ratio</div>
                <div className="text-lg font-bold text-blue-600">
                  {data.performance.avgLoss > 0 ? (data.performance.avgWin / data.performance.avgLoss).toFixed(2) : '∞'}:1
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500 mb-2">Best vs Worst Trade</div>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs text-gray-500">Best</div>
                <div className="text-lg font-bold text-green-600">${data.performance.bestTrade.toFixed(2)}</div>
              </div>
              <div className="text-2xl text-gray-400">vs</div>
              <div>
                <div className="text-xs text-gray-500">Worst</div>
                <div className="text-lg font-bold text-red-600">${data.performance.worstTrade.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Training Status */}
      <TrainingStatus />

      {/* Intelligent Watchlist Management */}
      <IntelligentDecisions />

      {/* Ticker Recommendations */}
      <TickerRecommendations />

      {/* Completed Trades */}
      {data.completedTrades.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b">
            <h3 className="font-semibold">Completed Trades</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Ticker</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Buy Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Sell Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">P/L</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Return %</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.completedTrades.map((trade, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2 text-sm font-medium">{trade.ticker}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {new Date(trade.buyDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {new Date(trade.sellDate).toLocaleDateString()}
                    </td>
                    <td className={`px-4 py-2 text-sm font-medium ${trade.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${trade.profit.toFixed(2)}
                    </td>
                    <td className={`px-4 py-2 text-sm ${trade.profitPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {trade.profitPercent >= 0 ? '+' : ''}{trade.profitPercent.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

