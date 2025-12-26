import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

/**
 * Get discovered stocks from recent discovery runs
 */
export async function GET(request: Request) {
  try {
    const supabase = getServiceSupabase()
    
    // Get the most recent discovery run
    const { data: latestRun } = await supabase
      .from('discovered_stocks')
      .select('discovery_run_id, discovered_at')
      .order('discovered_at', { ascending: false })
      .limit(1)
      .single()

    if (!latestRun) {
      return NextResponse.json({
        stocks: [],
        lastDiscovery: null
      })
    }

    // Get all stocks from the latest run
    const { data: stocks, error } = await supabase
      .from('discovered_stocks')
      .select('*')
      .eq('discovery_run_id', latestRun.discovery_run_id)
      .order('score', { ascending: false })

    if (error) {
      console.error('Error fetching discovered stocks:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      stocks: stocks || [],
      lastDiscovery: latestRun.discovered_at,
      runId: latestRun.discovery_run_id
    })

  } catch (error: any) {
    console.error('Error in discovered-stocks API:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch discovered stocks',
      message: error.message 
    }, { status: 500 })
  }
}

