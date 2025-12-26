'use client'

import { useState, useEffect } from 'react'
import PortfolioOverview from '@/components/PortfolioOverview'
import PositionsTable from '@/components/PositionsTable'
import TradeHistory from '@/components/TradeHistory'
import Watchlist from '@/components/Watchlist'
import StrategyControls from '@/components/StrategyControls'
import BotControls from '@/components/BotControls'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'
import EnhancedStrategyInfo from '@/components/EnhancedStrategyInfo'

export default function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>('overview')

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Auto Trader Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Automated stock trading with swing trading strategy
          </p>
        </div>

        {/* Bot Controls */}
        <div className="mb-6">
          <BotControls onStatusChange={handleRefresh} />
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
              }`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
              }`}
            >
              📈 Analytics
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' ? (
          <>
            {/* Portfolio Overview */}
            <div className="mb-6">
              <PortfolioOverview key={refreshKey} />
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Positions - Takes 2 columns */}
              <div className="lg:col-span-2">
                <PositionsTable key={refreshKey} />
              </div>

              {/* Watchlist - Takes 1 column */}
              <div>
                <Watchlist key={refreshKey} onUpdate={handleRefresh} />
              </div>
            </div>

            {/* Enhanced Strategy Info */}
            <div className="mb-6">
              <EnhancedStrategyInfo />
            </div>

            {/* Strategy Controls */}
            <div className="mb-6">
              <StrategyControls key={refreshKey} />
            </div>

            {/* Trade History */}
            <div>
              <TradeHistory key={refreshKey} />
            </div>
          </>
        ) : (
          <AnalyticsDashboard />
        )}
      </div>
    </div>
  )
}

