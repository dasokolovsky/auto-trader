-- Auto Trader Database Schema
-- Run this in your Supabase SQL Editor

-- Watchlist table
CREATE TABLE IF NOT EXISTS watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker VARCHAR(10) NOT NULL UNIQUE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker VARCHAR(10) NOT NULL,
  side VARCHAR(4) NOT NULL CHECK (side IN ('buy', 'sell')),
  quantity DECIMAL NOT NULL,
  price DECIMAL NOT NULL,
  total_value DECIMAL NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  strategy_params JSONB,
  alpaca_order_id VARCHAR(255)
);

-- Strategy configuration table
CREATE TABLE IF NOT EXISTS strategy_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  params JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bot status table
CREATE TABLE IF NOT EXISTS bot_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_running BOOLEAN DEFAULT false,
  last_run_at TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications log table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'sent'
);

-- Insert default strategy config
INSERT INTO strategy_config (name, is_active, params)
VALUES (
  'Default Swing Trading Strategy',
  true,
  '{
    "rsi_oversold": 30,
    "rsi_overbought": 70,
    "dip_percentage": 5,
    "profit_target_percent": 8,
    "stop_loss_percent": 3,
    "max_positions": 5,
    "position_size_usd": 1000,
    "lookback_days": 20
  }'::jsonb
)
ON CONFLICT DO NOTHING;

-- Insert default bot status
INSERT INTO bot_status (is_running)
VALUES (false)
ON CONFLICT DO NOTHING;

-- Insert TSLA to watchlist
INSERT INTO watchlist (ticker, is_active)
VALUES ('TSLA', true)
ON CONFLICT (ticker) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trades_ticker ON trades(ticker);
CREATE INDEX IF NOT EXISTS idx_trades_executed_at ON trades(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_watchlist_active ON watchlist(is_active);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications(sent_at DESC);

