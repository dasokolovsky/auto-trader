-- Add is_simulated column to trades table to distinguish backtest data from real trades
ALTER TABLE trades ADD COLUMN IF NOT EXISTS is_simulated BOOLEAN DEFAULT FALSE;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_trades_is_simulated ON trades(is_simulated);

-- Add comment
COMMENT ON COLUMN trades.is_simulated IS 'True if this trade is from backtesting/simulation, false if real trade';

