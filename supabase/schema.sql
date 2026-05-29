-- SHOT MARKET DATABASE SCHEMA

-- 1. PROFILES
-- Tracks user shot-credits (accountability score)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY, -- Removed foreign key for flexibility
  username TEXT UNIQUE NOT NULL,
  credits NUMERIC DEFAULT 0, -- Can be negative
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MARKETS
-- The core prediction markets
CREATE TABLE IF NOT EXISTS markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES profiles(id) NOT NULL,
  question TEXT NOT NULL,
  description TEXT,
  yes_pool NUMERIC DEFAULT 100, -- Initial "liquidity"
  no_pool NUMERIC DEFAULT 100,
  p NUMERIC DEFAULT 0.5, -- Initial probability (Manifold CPMM p)
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved_yes', 'resolved_no', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- 3. BETS
-- Individual ledger of bets
CREATE TABLE IF NOT EXISTS bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  market_id UUID REFERENCES markets(id) NOT NULL,
  amount NUMERIC NOT NULL, -- "Shots" bet
  outcome TEXT NOT NULL CHECK (outcome IN ('YES', 'NO')),
  shares NUMERIC NOT NULL, -- Payout value if correct
  probability_at_bet NUMERIC NOT NULL, -- The odds at the moment of the bet (for graphing)
  comment TEXT, -- Optional trash talk / reason for the bet
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RPC FUNCTIONS (Atomic Transactions)

/**
 * Executes a bet atomically.
 * Ensures the user's credits are updated and the market pools are adjusted
 * in a single transaction to prevent race conditions.
 */
CREATE OR REPLACE FUNCTION place_bet(
  p_user_id UUID,
  p_market_id UUID,
  p_amount NUMERIC,
  p_outcome TEXT,
  p_shares NUMERIC,
  p_probability_at_bet NUMERIC,
  p_new_yes_pool NUMERIC,
  p_new_no_pool NUMERIC,
  p_comment TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  -- 1. Deduct amount from user credits
  UPDATE profiles 
  SET credits = credits - p_amount 
  WHERE id = p_user_id;

  -- 2. Update market pools
  UPDATE markets 
  SET yes_pool = p_new_yes_pool, no_pool = p_new_no_pool 
  WHERE id = p_market_id;

  -- 3. Record the bet
  INSERT INTO bets (user_id, market_id, amount, outcome, shares, probability_at_bet, comment)
  VALUES (p_user_id, p_market_id, p_amount, p_outcome, p_shares, p_probability_at_bet, p_comment);
END;
$$ LANGUAGE plpgsql;
