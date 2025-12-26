// Database Types
export interface WatchlistItem {
  id: string
  ticker: string
  added_at: string
  is_active: boolean
}

export interface Trade {
  id: string
  ticker: string
  side: 'buy' | 'sell'
  quantity: number
  price: number
  total_value: number
  executed_at: string
  strategy_params?: Record<string, any>
}

export interface Position {
  id: string
  ticker: string
  quantity: number
  entry_price: number
  current_price: number
  unrealized_pl: number
  unrealized_pl_percent: number
  opened_at: string
}

export interface StrategyConfig {
  id: string
  name: string
  is_active: boolean
  params: {
    rsi_oversold: number
    rsi_overbought: number
    dip_percentage: number
    profit_target_percent: number
    stop_loss_percent: number
    max_positions: number
    position_size_usd: number
    lookback_days: number
  }
  updated_at: string
}

// Alpaca Types
export interface AlpacaPosition {
  symbol: string
  qty: string
  avg_entry_price: string
  current_price: string
  market_value: string
  unrealized_pl: string
  unrealized_plpc: string
}

export interface AlpacaOrder {
  id: string
  symbol: string
  side: 'buy' | 'sell'
  qty: string
  filled_avg_price: string
  filled_at: string
  status: string
}

export interface AlpacaAccount {
  equity: string
  cash: string
  buying_power: string
  portfolio_value: string
}

// Trading Signal Types
export interface TradingSignal {
  ticker: string
  action: 'buy' | 'sell' | 'hold'
  reason: string
  indicators: {
    rsi?: number
    price_change_percent?: number
    current_price?: number
  }
}

// Dashboard Types
export interface PortfolioStats {
  total_value: number
  cash: number
  equity: number
  total_pl: number
  total_pl_percent: number
  win_rate: number
  total_trades: number
}

