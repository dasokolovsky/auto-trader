'use client'

import { useState } from 'react'

interface CronJob {
  id: string
  name: string
  description: string
  schedule: string
  icon: string
}

const cronJobs: CronJob[] = [
  {
    id: 'execute-strategy',
    name: 'Execute Strategy',
    description: 'Analyze watchlist and execute trades',
    schedule: 'Every 15 min (9:30-4 PM)',
    icon: '🎯'
  },
  {
    id: 'manage-watchlist',
    name: 'Manage Watchlist',
    description: 'Discover new stocks and remove poor performers',
    schedule: 'Daily at 8 AM ET',
    icon: '🔍'
  },
  {
    id: 'daily-snapshot',
    name: 'Daily Snapshot',
    description: 'Capture portfolio performance metrics',
    schedule: 'Daily at 5 PM ET',
    icon: '📸'
  }
]

export default function CronControls() {
  const [loading, setLoading] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const triggerCron = async (cronJob: string) => {
    setLoading(cronJob)
    setErrors({ ...errors, [cronJob]: '' })
    
    try {
      const res = await fetch('/api/admin/trigger-cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cronJob })
      })

      const data = await res.json()

      if (!res.ok) {
        setErrors({ ...errors, [cronJob]: data.error || 'Failed to trigger cron job' })
      } else {
        setResults({ ...results, [cronJob]: data })
      }
    } catch (error: any) {
      setErrors({ ...errors, [cronJob]: error.message })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Cron Job Controls</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manually trigger automated tasks for testing
          </p>
        </div>
        <div className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-lg text-xs font-medium">
          ADMIN
        </div>
      </div>

      <div className="space-y-3">
        {cronJobs.map((job) => (
          <div
            key={job.id}
            className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{job.icon}</span>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{job.name}</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {job.description}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Schedule: {job.schedule}
                </p>

                {/* Result */}
                {results[job.id] && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="text-xs font-medium text-green-800 dark:text-green-400 mb-1">
                      ✅ Success
                    </div>
                    <pre className="text-xs text-green-700 dark:text-green-300 overflow-x-auto">
                      {JSON.stringify(results[job.id].result, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Error */}
                {errors[job.id] && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="text-xs font-medium text-red-800 dark:text-red-400">
                      ❌ {errors[job.id]}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => triggerCron(job.id)}
                disabled={loading === job.id}
                className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading === job.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Running...
                  </>
                ) : (
                  <>
                    ▶️ Run Now
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="text-xs text-blue-800 dark:text-blue-400">
          💡 <strong>Tip:</strong> These jobs run automatically on schedule. Use manual triggers for testing or when you want immediate results.
        </div>
      </div>
    </div>
  )
}

