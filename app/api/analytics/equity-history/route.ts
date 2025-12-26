import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Fetch daily snapshots ordered by date
    const { data, error } = await supabase
      .from('daily_snapshots')
      .select('date, equity, total_value')
      .order('date', { ascending: true })
      .limit(90) // Last 90 days

    if (error) {
      console.error('Error fetching equity history:', error)
      return NextResponse.json({ data: [] })
    }

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error('Error in equity-history API:', error)
    return NextResponse.json({ data: [] })
  }
}

