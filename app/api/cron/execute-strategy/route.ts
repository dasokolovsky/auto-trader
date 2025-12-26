import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { alpacaClient } from '@/lib/alpaca'
import { EnhancedTradingStrategy } from '@/lib/enhanced-strategy'
import { IntelligentTrader } from '@/lib/intelligent-trader'
import { PositionSizer } from '@/lib/position-sizer'

export async function GET(request: Request) {
  const startTime = Date.now()

  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getServiceSupabase()

    // Check if bot is running
    const { data: botStatus } = await supabase
      .from('bot_status')
      .select('*')
      .single()

    if (!botStatus?.is_running) {
      return NextResponse.json({
        message: 'Bot is not running',
        executed: false
      })
    }

    // Check if market is open
    const isMarketOpen = await alpacaClient.isMarketOpen()

    // Get account info for logging
    const account = await alpacaClient.getAccount()

    if (!isMarketOpen) {
      // Still log the execution attempt
      await supabase.from('execution_log').insert({
        market_open: false,
        tickers_analyzed: [],
        signals_generated: {},
        trades_executed: 0,
        execution_time_ms: Date.now() - startTime,
        portfolio_value: parseFloat(account.portfolio_value),
        cash_balance: parseFloat(account.cash)
      })

      return NextResponse.json({
        message: 'Market is closed',
        executed: false
      })
    }

    // Get active strategy config
    const { data: strategyConfig } = await supabase
      .from('strategy_config')
      .select('*')
      .eq('is_active', true)
      .single()

    if (!strategyConfig) {
      throw new Error('No active strategy found')
    }

    const strategy = new EnhancedTradingStrategy(strategyConfig.params)
    const intelligentTrader = new IntelligentTrader()
    const positionSizer = new PositionSizer()

    // Auto-cleanup watchlist (remove poor performers)
    const cleanup = await intelligentTrader.autoCleanupWatchlist()
    if (cleanup.removed.length > 0) {
      console.log(`🧹 Auto-cleanup removed ${cleanup.removed.length} tickers:`, cleanup.removed)
    }

    // Get watchlist (after cleanup)
    const { data: watchlist } = await supabase
      .from('watchlist')
      .select('*')
      .eq('is_active', true)

    if (!watchlist || watchlist.length === 0) {
      return NextResponse.json({ 
        message: 'No tickers in watchlist',
        executed: false 
      })
    }

    // Get current positions
    const positions = await alpacaClient.getPositions()
    const positionMap = new Map(positions.map(p => [p.symbol, p]))

    const results = []
    const allSignals = []
    let tradesExecuted = 0

    // Create execution log entry
    const { data: executionLog } = await supabase
      .from('execution_log')
      .insert({
        market_open: true,
        tickers_analyzed: watchlist.map(w => w.ticker),
        signals_generated: {},
        trades_executed: 0,
        portfolio_value: parseFloat(account.portfolio_value),
        cash_balance: parseFloat(account.cash)
      })
      .select()
      .single()

    // Process each ticker in watchlist
    for (const item of watchlist) {
      const ticker = item.ticker
      const currentPosition = positionMap.get(ticker)

      // Generate trading signal
      const signal = await strategy.generateSignal(ticker, currentPosition)

      results.push({
        ticker,
        signal: signal.action,
        reason: signal.reason,
        indicators: signal.indicators
      })

      // Log signal to signal_history
      await supabase.from('signal_history').insert({
        ticker,
        signal_type: signal.action.toUpperCase(),
        rsi: signal.indicators?.rsi,
        current_price: signal.indicators?.current_price,
        dip_percentage: (signal.indicators as any)?.dip_percentage,
        reason: signal.reason,
        was_executed: false,
        execution_log_id: executionLog?.id
      })

      allSignals.push({
        ticker,
        action: signal.action,
        reason: signal.reason,
        rsi: signal.indicators?.rsi,
        price: signal.indicators?.current_price
      })

      // Execute trades based on signals
      if (signal.action === 'buy') {
        // INTELLIGENT DECISION: Should we actually buy this ticker?
        const decision = await intelligentTrader.shouldBuyTicker(ticker, signal.action)

        if (!decision.shouldBuy) {
          console.log(`🚫 Skipping ${ticker}: ${decision.reason}`)

          // Log the decision
          await supabase.from('signal_history').insert({
            ticker,
            signal_type: 'BUY_REJECTED',
            rsi: signal.indicators?.rsi,
            current_price: signal.indicators?.current_price,
            reason: decision.reason,
            was_executed: false,
            execution_log_id: executionLog?.id
          })

          continue
        }

        console.log(`✅ Approved to buy ${ticker}: ${decision.reason}`)

        // Check if we can open a new position
        if (positions.length >= strategyConfig.params.max_positions) {
          console.log(`Max positions reached (${strategyConfig.params.max_positions})`)
          continue
        }

        // Calculate quantity using intelligent position sizing
        const positionSize = await positionSizer.calculatePositionSize(
          ticker,
          signal.indicators.current_price!,
          parseFloat(account.portfolio_value)
        )

        console.log(`📊 Position size for ${ticker}: ${positionSize.shares} shares ($${positionSize.dollarAmount.toFixed(0)}) - ${positionSize.reason}`)

        if (positionSize.shares > 0) {
          const qty = positionSize.shares
          const order = await alpacaClient.createOrder(ticker, qty, 'buy')

          // Log trade to database
          await supabase.from('trades').insert({
            ticker,
            side: 'buy',
            quantity: qty,
            price: parseFloat(order.filled_avg_price || '0'),
            total_value: qty * parseFloat(order.filled_avg_price || '0'),
            alpaca_order_id: order.id,
            strategy_params: {
              ...strategyConfig.params,
              rsi: signal.indicators?.rsi,
              reason: signal.reason
            }
          })

          // Update signal as executed
          await supabase
            .from('signal_history')
            .update({ was_executed: true })
            .eq('ticker', ticker)
            .eq('execution_log_id', executionLog?.id)
            .eq('signal_type', 'BUY')

          tradesExecuted++
          console.log(`BUY executed: ${ticker} x ${qty} @ ${order.filled_avg_price}`)
        }
      } else if (signal.action === 'sell' && currentPosition) {
        // Sell entire position
        const qty = Math.abs(parseFloat(currentPosition.qty))
        const order = await alpacaClient.createOrder(ticker, qty, 'sell')

        // Log trade to database
        await supabase.from('trades').insert({
          ticker,
          side: 'sell',
          quantity: qty,
          price: parseFloat(order.filled_avg_price || '0'),
          total_value: qty * parseFloat(order.filled_avg_price || '0'),
          alpaca_order_id: order.id,
          strategy_params: {
            ...strategyConfig.params,
            rsi: signal.indicators?.rsi,
            reason: signal.reason
          }
        })

        // Update signal as executed
        await supabase
          .from('signal_history')
          .update({ was_executed: true })
          .eq('ticker', ticker)
          .eq('execution_log_id', executionLog?.id)
          .eq('signal_type', 'SELL')

        tradesExecuted++
        console.log(`SELL executed: ${ticker} x ${qty} @ ${order.filled_avg_price}`)

        // INTELLIGENT DECISION: Should we remove this ticker from watchlist?
        const removeDecision = await intelligentTrader.shouldRemoveFromWatchlist(ticker)

        if (removeDecision.shouldRemove) {
          console.log(`🗑️  Removing ${ticker} from watchlist: ${removeDecision.reason}`)

          // Deactivate from watchlist
          await supabase
            .from('watchlist')
            .update({ is_active: false })
            .eq('ticker', ticker)

          // Log the removal
          await supabase.from('signal_history').insert({
            ticker,
            signal_type: 'WATCHLIST_REMOVED',
            reason: removeDecision.reason,
            was_executed: true,
            execution_log_id: executionLog?.id
          })
        }
      }
    }

    // Update execution log with final results
    if (executionLog) {
      await supabase
        .from('execution_log')
        .update({
          signals_generated: allSignals,
          trades_executed: tradesExecuted,
          execution_time_ms: Date.now() - startTime
        })
        .eq('id', executionLog.id)
    }

    // Update last run time
    await supabase
      .from('bot_status')
      .update({ 
        last_run_at: new Date().toISOString(),
        last_error: null
      })
      .eq('id', botStatus.id)

    return NextResponse.json({
      message: 'Strategy executed successfully',
      executed: true,
      results,
      cleanup: {
        removed: cleanup.removed,
        count: cleanup.removed.length
      }
    })

  } catch (error) {
    console.error('Error executing strategy:', error)
    
    // Log error to database
    const supabase = getServiceSupabase()
    await supabase
      .from('bot_status')
      .update({ 
        last_error: error instanceof Error ? error.message : 'Unknown error',
        last_run_at: new Date().toISOString()
      })

    return NextResponse.json(
      { error: 'Failed to execute strategy' },
      { status: 500 }
    )
  }
}

