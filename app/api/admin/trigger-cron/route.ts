import { NextResponse } from 'next/server'

/**
 * Manual Cron Job Trigger
 * Allows admin to manually run cron jobs for testing/debugging
 */
export async function POST(request: Request) {
  try {
    const { cronJob } = await request.json()

    if (!cronJob) {
      return NextResponse.json({ error: 'cronJob parameter required' }, { status: 400 })
    }

    const validJobs = ['execute-strategy', 'manage-watchlist', 'daily-snapshot']
    if (!validJobs.includes(cronJob)) {
      return NextResponse.json({ 
        error: `Invalid cronJob. Must be one of: ${validJobs.join(', ')}` 
      }, { status: 400 })
    }

    console.log(`🔧 Manually triggering cron job: ${cronJob}`)

    // Call the cron endpoint with the CRON_SECRET
    const cronUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/cron/${cronJob}`
    
    const response = await fetch(cronUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`
      }
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Cron job failed', 
        details: data 
      }, { status: response.status })
    }

    return NextResponse.json({
      success: true,
      cronJob,
      result: data,
      triggeredAt: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Error triggering cron job:', error)
    return NextResponse.json({ 
      error: 'Failed to trigger cron job', 
      message: error.message 
    }, { status: 500 })
  }
}

