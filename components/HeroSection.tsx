'use client'

import { useState, useEffect } from 'react'
import { AlpacaAccount } from '@/types'

interface HeroSectionProps {
  onPause?: () => void
  onResume?: () => void
  botStatus?: string
}

export default function HeroSection({ onPause, onResume, botStatus }: HeroSectionProps) {
  const [account, setAccount] = useState<AlpacaAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [todayPL, setTodayPL] = useState(0)

  useEffect(() => {
    fetchAccount()
  }, [])

  const fetchAccount = async () => {
    try {
      const res = await fetch('/api/account')
      const data = await res.json()
      setAccount(data.account)
      
      // Calculate today's P/L (simplified - you might want to fetch this from daily_snapshots)
      const equity = parseFloat(data.account.equity)
      const initialEquity = 100000 // Your starting balance
      setTodayPL(equity - initialEquity)
    } catch (error) {
      console.error('Error fetching account:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 rounded-2xl shadow-2xl p-8 mb-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-16 bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-6 bg-gray-700 rounded w-1/3"></div>
        </div>
      </div>
    )
  }

  if (!account) return null

  const equity = parseFloat(account.equity)
  const initialEquity = 100000
  const totalPL = equity - initialEquity
  const totalPLPercent = (totalPL / initialEquity) * 100
  const isProfit = totalPL >= 0

  return (
    <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 rounded-2xl shadow-2xl p-8 mb-6 border border-blue-800/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="text-4xl">🚀</div>
          <div>
            <h1 className="text-2xl font-bold text-white">AUTO-TRADER</h1>
            <p className="text-sm text-blue-300">Command Center</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Bot Status */}
          <div className="flex items-center gap-2 bg-gray-800/50 px-4 py-2 rounded-lg">
            <div className={`w-3 h-3 rounded-full ${botStatus === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
            <span className="text-sm font-medium text-white uppercase">
              {botStatus || 'Active'}
            </span>
          </div>
          
          {/* Quick Actions */}
          <button
            onClick={botStatus === 'active' ? onPause : onResume}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            {botStatus === 'active' ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>

      {/* Main P/L Display */}
      <div className="mb-6">
        <div className="text-sm text-blue-300 mb-2 font-medium">TOTAL PROFIT/LOSS</div>
        <div className="flex items-baseline gap-4">
          <div className={`text-6xl font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
            {isProfit ? '+' : ''}${Math.abs(totalPL).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className={`text-3xl font-semibold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
            ({isProfit ? '+' : ''}{totalPLPercent.toFixed(2)}%)
          </div>
        </div>
        
        {/* Today's P/L */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-sm text-gray-400">Today:</span>
          <span className={`text-lg font-semibold ${todayPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {todayPL >= 0 ? '+' : ''}${todayPL.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
          <div className="text-xs text-gray-400 mb-1">Portfolio Value</div>
          <div className="text-xl font-bold text-white">
            ${equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
          <div className="text-xs text-gray-400 mb-1">Cash Available</div>
          <div className="text-xl font-bold text-white">
            ${parseFloat(account.cash).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
          <div className="text-xs text-gray-400 mb-1">Buying Power</div>
          <div className="text-xl font-bold text-white">
            ${parseFloat(account.buying_power).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
          <div className="text-xs text-gray-400 mb-1">Day Trade Count</div>
          <div className="text-xl font-bold text-white">
            {account.daytrade_count || 0} / 3
          </div>
        </div>
      </div>
    </div>
  )
}

