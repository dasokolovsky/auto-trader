import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = getServiceSupabase()
    const { data, error } = await supabase
      .from('bot_status')
      .select('*')
      .single()

    if (error) throw error

    return NextResponse.json({ status: data })
  } catch (error) {
    console.error('Error fetching bot status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bot status' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { is_running } = await request.json()

    if (typeof is_running !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid is_running value' },
        { status: 400 }
      )
    }

    const supabase = getServiceSupabase()
    
    const { data: currentStatus } = await supabase
      .from('bot_status')
      .select('*')
      .single()

    const { data, error } = await supabase
      .from('bot_status')
      .update({ 
        is_running,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentStatus?.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ status: data })
  } catch (error) {
    console.error('Error updating bot status:', error)
    return NextResponse.json(
      { error: 'Failed to update bot status' },
      { status: 500 }
    )
  }
}

