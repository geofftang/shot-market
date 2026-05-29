'use server'

import { createClient } from '@supabase/supabase-js';
import { calculateCpmmPurchase, getCpmmProbability } from '@/lib/engine/cpmm';
import { revalidatePath } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use service role for server actions

export async function placeBetAction(formData: FormData) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const userId = formData.get('userId') as string;
  const marketId = formData.get('marketId') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const outcome = formData.get('outcome') as 'YES' | 'NO';
  const comment = formData.get('comment') as string;

  if (!userId || !marketId || isNaN(amount) || amount <= 0) {
    throw new Error('Invalid bet parameters');
  }

  // 1. Fetch current market state
  const { data: market, error: marketError } = await supabase
    .from('markets')
    .select('*')
    .eq('id', marketId)
    .single();

  if (marketError || !market) throw new Error('Market not found');
  if (market.status !== 'open') throw new Error('Market is closed');

  // 2. Calculate the trade using the engine
  const pool = { YES: parseFloat(market.yes_pool), NO: parseFloat(market.no_pool) };
  const p = parseFloat(market.p);
  
  const { shares, newPool } = calculateCpmmPurchase(pool, p, amount, outcome);
  const newProbability = getCpmmProbability(newPool, p);

  // 3. Execute the atomic RPC call
  const { error: rpcError } = await supabase.rpc('place_bet', {
    p_user_id: userId,
    p_market_id: marketId,
    p_amount: amount,
    p_outcome: outcome,
    p_shares: shares,
    p_probability_at_bet: newProbability,
    p_new_yes_pool: newPool.YES,
    p_new_no_pool: newPool.NO,
    p_comment: comment || null
  });

  if (rpcError) throw new Error(rpcError.message);

  // 4. Update the UI
  revalidatePath(`/markets/${marketId}`);
  return { success: true };
}
