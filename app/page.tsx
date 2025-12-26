'use client'

import { useState, useEffect } from 'react'
import HeroSection from '@/components/HeroSection'
import EquityChart from '@/components/EquityChart'
import CompactPositions from '@/components/CompactPositions'
import ActivityFeed from '@/components/ActivityFeed'
import EnhancedWatchlist from '@/components/EnhancedWatchlist'
import PerformanceMetrics from '@/components/PerformanceMetrics'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'
import CronControls from '@/components/CronControls'
import DiscoveredStocks from '@/components/DiscoveredStocks'

export default function Dashboard() {
  const [activeView, setActiveView] = useState<'dashboard' | 'analytics' | 'admin'>('dashboard')
  const [botStatus, setBotStatus] = useState('active')

  // Auto-refresh every 30 seconds during market hours
  useEffect(() => {
    const checkMarketHours = () => {
      const now = new Date()
      const hour = now.getHours()
      const day = now.getDay()

      // Market hours: Mon-Fri, 9:30 AM - 4:00 PM ET (simplified)
      const isMarketHours = day >= 1 && day <= 5 && hour >= 9 && hour <= 16

      if (isMarketHours) {
        // Trigger refresh by updating a key or calling refresh functions
        console.log('Market hours - auto-refreshing...')
      }
    }

    const interval = setInterval(checkMarketHours, 30000)
    return () => clearInterval(interval)
  }, [])

  const handlePause = () => {
    setBotStatus('paused')
    // TODO: Call API to pause bot
  }

  const handleResume = () => {
    setBotStatus('active')
    // TODO: Call API to resume bot
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-3">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
                activeView === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setActiveView('analytics')}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
                activeView === 'analytics'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              📈 Analytics
            </button>
            <button
              onClick={() => setActiveView('admin')}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
                activeView === 'admin'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              🔧 Admin
            </button>
          </div>

          {/* Market Status Indicator */}
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Live Updates
            </span>
          </div>
        </div>

        {/* Content */}
        {activeView === 'dashboard' ? (
          <>
            {/* Hero Section */}
            <HeroSection
              onPause={handlePause}
              onResume={handleResume}
              botStatus={botStatus}
            />

            {/* Equity Chart - Full Width */}
            <div className="mb-6">
              <EquityChart />
            </div>

            {/* Main Grid - Positions & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                <CompactPositions />
              </div>
              <div>
                <ActivityFeed />
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="mb-6">
              <PerformanceMetrics />
            </div>

            {/* Watchlist & Discovery Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EnhancedWatchlist />
              <DiscoveredStocks />
            </div>
          </>
        ) : activeView === 'analytics' ? (
          <AnalyticsDashboard />
        ) : (
          /* Admin View */
          <div className="space-y-6">
            <CronControls />
            <DiscoveredStocks />
            <EnhancedWatchlist />
          </div>
        )}
      </div>
    </div>
  )
}

