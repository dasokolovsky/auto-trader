import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = getServiceSupabase()
    const { data, error } = await supabase
      .from('strategy_config')
      .select('*')
      .eq('is_active', true)
      .single()

    if (error) throw error

    return NextResponse.json({ strategy: data })
  } catch (error) {
    console.error('Error fetching strategy:', error)
    return NextResponse.json(
      { error: 'Failed to fetch strategy config' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { params } = await request.json()

    if (!params) {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 }
      )
    }

    const supabase = getServiceSupabase()
    
    // Get the active strategy
    const { data: currentStrategy } = await supabase
      .from('strategy_config')
      .select('*')
      .eq('is_active', true)
      .single()

    if (!currentStrategy) {
      return NextResponse.json(
        { error: 'No active strategy found' },
        { status: 404 }
      )
    }

    // Update the strategy params
    const { data, error } = await supabase
      .from('strategy_config')
      .update({ 
        params,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentStrategy.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ strategy: data })
  } catch (error) {
    console.error('Error updating strategy:', error)
    return NextResponse.json(
      { error: 'Failed to update strategy config' },
      { status: 500 }
    )
  }
}

