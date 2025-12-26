import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = getServiceSupabase()
    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .eq('is_active', true)
      .order('added_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ watchlist: data })
  } catch (error) {
    console.error('Error fetching watchlist:', error)
    return NextResponse.json(
      { error: 'Failed to fetch watchlist' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { ticker } = await request.json()

    if (!ticker || typeof ticker !== 'string') {
      return NextResponse.json(
        { error: 'Invalid ticker' },
        { status: 400 }
      )
    }

    const supabase = getServiceSupabase()
    const { data, error } = await supabase
      .from('watchlist')
      .insert({ ticker: ticker.toUpperCase(), is_active: true })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ watchlist: data })
  } catch (error) {
    console.error('Error adding to watchlist:', error)
    return NextResponse.json(
      { error: 'Failed to add ticker to watchlist' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Missing ticker ID' },
        { status: 400 }
      )
    }

    const supabase = getServiceSupabase()
    const { error } = await supabase
      .from('watchlist')
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing from watchlist:', error)
    return NextResponse.json(
      { error: 'Failed to remove ticker from watchlist' },
      { status: 500 }
    )
  }
}

