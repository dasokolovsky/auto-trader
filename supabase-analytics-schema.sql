-- Additional tables for analytics and performance tracking
-- Run this to add analytics capabilities

-- Strategy execution log (every time the cron runs)
CREATE TABLE IF NOT EXISTS execution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  market_open BOOLEAN NOT NULL,
  tickers_analyzed TEXT[] NOT NULL,
  signals_generated JSONB NOT NULL,
  trades_executed INTEGER DEFAULT 0,
  errors TEXT,
  execution_time_ms INTEGER,
  portfolio_value DECIMAL,
  cash_balance DECIMAL
);

-- Signal history (every signal generated, whether traded or not)
CREATE TABLE IF NOT EXISTS signal_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ticker VARCHAR(10) NOT NULL,
  signal_type VARCHAR(10) NOT NULL CHECK (signal_type IN ('BUY', 'SELL', 'HOLD')),
  rsi DECIMAL,
  current_price DECIMAL,
  dip_percentage DECIMAL,
  reason TEXT,
  was_executed BOOLEAN DEFAULT false,
  execution_log_id UUID REFERENCES execution_log(id)
);

-- Daily portfolio snapshots
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL UNIQUE,
  portfolio_value DECIMAL NOT NULL,
  cash_balance DECIMAL NOT NULL,
  equity_value DECIMAL NOT NULL,
  total_positions INTEGER NOT NULL,
  daily_return_percent DECIMAL,
  cumulative_return_percent DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance metrics (calculated daily)
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  period_days INTEGER NOT NULL,
  total_trades INTEGER,
  winning_trades INTEGER,
  losing_trades INTEGER,
  win_rate DECIMAL,
  total_profit_loss DECIMAL,
  avg_profit_per_trade DECIMAL,
  max_drawdown DECIMAL,
  sharpe_ratio DECIMAL,
  best_performing_ticker VARCHAR(10),
  worst_performing_ticker VARCHAR(10),
  metrics_json JSONB
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_execution_log_date ON execution_log(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_signal_history_ticker ON signal_history(ticker);
CREATE INDEX IF NOT EXISTS idx_signal_history_date ON signal_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_date ON portfolio_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_date ON performance_metrics(calculated_at DESC);

-- View for quick analysis
CREATE OR REPLACE VIEW trading_summary AS
SELECT 
  DATE(executed_at) as trade_date,
  ticker,
  side,
  quantity,
  price,
  total_value,
  strategy_params->>'rsi' as rsi_at_trade,
  strategy_params->>'reason' as trade_reason
FROM trades
ORDER BY executed_at DESC;

-- View for signal effectiveness
CREATE OR REPLACE VIEW signal_effectiveness AS
SELECT 
  ticker,
  signal_type,
  COUNT(*) as total_signals,
  SUM(CASE WHEN was_executed THEN 1 ELSE 0 END) as executed_signals,
  ROUND(AVG(rsi), 2) as avg_rsi,
  ROUND(AVG(current_price), 2) as avg_price
FROM signal_history
GROUP BY ticker, signal_type
ORDER BY ticker, signal_type;

