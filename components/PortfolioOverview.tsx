'use client'

import { useState, useEffect } from 'react'
import { AlpacaAccount } from '@/types'

export default function PortfolioOverview() {
  const [account, setAccount] = useState<AlpacaAccount | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAccount()
  }, [])

  const fetchAccount = async () => {
    try {
      const res = await fetch('/api/account')
      const data = await res.json()
      setAccount(data.account)
    } catch (error) {
      console.error('Error fetching account:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!account) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-red-600 dark:text-red-400">Failed to load account data</p>
      </div>
    )
  }

  const equity = parseFloat(account.equity)
  const cash = parseFloat(account.cash)
  const portfolioValue = parseFloat(account.portfolio_value)
  const buyingPower = parseFloat(account.buying_power)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Portfolio Overview
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Portfolio Value</p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
            ${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">Equity</p>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
            ${equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Cash</p>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
            ${cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
          <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Buying Power</p>
          <p className="text-2xl font-bold text-orange-900 dark:text-orange-100 mt-1">
            ${buyingPower.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </div>
  )
}

