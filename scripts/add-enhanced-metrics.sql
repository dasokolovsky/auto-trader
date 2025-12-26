-- Add enhanced metrics columns to backtest_results table
-- This supports QUICK WINS #4 and #5: Sharpe Ratio and Max Drawdown

-- Check if table exists, if not create it
CREATE TABLE IF NOT EXISTS backtest_results (
  id BIGSERIAL PRIMARY KEY,
  ticker TEXT NOT NULL,
  total_trades INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  total_profit DECIMAL(10,2) DEFAULT 0,
  avg_profit DECIMAL(10,2) DEFAULT 0,
  score INTEGER DEFAULT 0,
  tested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add new enhanced metrics columns if they don't exist
DO $$ 
BEGIN
  -- Sharpe Ratio (QUICK WIN #4)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='backtest_results' AND column_name='sharpe_ratio') THEN
    ALTER TABLE backtest_results ADD COLUMN sharpe_ratio DECIMAL(10,4) DEFAULT 0;
  END IF;

  -- Max Drawdown (QUICK WIN #5)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='backtest_results' AND column_name='max_drawdown') THEN
    ALTER TABLE backtest_results ADD COLUMN max_drawdown DECIMAL(10,4) DEFAULT 0;
  END IF;

  -- Profit Factor
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='backtest_results' AND column_name='profit_factor') THEN
    ALTER TABLE backtest_results ADD COLUMN profit_factor DECIMAL(10,4) DEFAULT 0;
  END IF;

  -- Expectancy
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='backtest_results' AND column_name='expectancy') THEN
    ALTER TABLE backtest_results ADD COLUMN expectancy DECIMAL(10,4) DEFAULT 0;
  END IF;
END $$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_backtest_ticker ON backtest_results(ticker);
CREATE INDEX IF NOT EXISTS idx_backtest_score ON backtest_results(score DESC);
CREATE INDEX IF NOT EXISTS idx_backtest_sharpe ON backtest_results(sharpe_ratio DESC);
CREATE INDEX IF NOT EXISTS idx_backtest_tested_at ON backtest_results(tested_at DESC);

-- Grant permissions
GRANT ALL ON backtest_results TO authenticated;
GRANT ALL ON backtest_results TO service_role;

