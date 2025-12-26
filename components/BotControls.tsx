'use client'

import { useState, useEffect } from 'react'

interface BotControlsProps {
  onStatusChange?: () => void
}

export default function BotControls({ onStatusChange }: BotControlsProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lastRun, setLastRun] = useState<string | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)

  useEffect(() => {
    fetchStatus()
    // Poll status every 30 seconds
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/bot/status')
      const data = await res.json()
      if (data.status) {
        setIsRunning(data.status.is_running)
        setLastRun(data.status.last_run_at)
        setLastError(data.status.last_error)
      }
    } catch (error) {
      console.error('Error fetching bot status:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleBot = async () => {
    try {
      const res = await fetch('/api/bot/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_running: !isRunning })
      })

      if (res.ok) {
        const data = await res.json()
        setIsRunning(data.status.is_running)
        onStatusChange?.()
      }
    } catch (error) {
      console.error('Error toggling bot:', error)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Trading Bot
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {isRunning ? 'Running' : 'Stopped'}
              </span>
            </div>
          </div>

          {lastRun && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Last run:</span>{' '}
              {new Date(lastRun).toLocaleString()}
            </div>
          )}
        </div>

        <button
          onClick={toggleBot}
          className={`px-6 py-3 rounded-md font-semibold transition-colors ${
            isRunning
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isRunning ? 'Stop Bot' : 'Start Bot'}
        </button>
      </div>

      {lastError && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-800 dark:text-red-400">
            <span className="font-semibold">Last Error:</span> {lastError}
          </p>
        </div>
      )}

      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
        <p className="text-sm text-blue-800 dark:text-blue-400">
          <span className="font-semibold">ℹ️ Info:</span> The bot runs every 15 minutes during market hours (9:30 AM - 4 PM ET) when enabled.
        </p>
      </div>
    </div>
  )
}

