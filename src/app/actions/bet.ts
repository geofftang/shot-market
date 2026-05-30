'use server'

import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { calculateCpmmPurchase, getCpmmProbability } from '@/lib/engine/cpmm';
import { revalidatePath } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function placeBetAction(formData: FormData) {
  // 1. Verify Authentication
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  
  if (!user) throw new Error('You must be logged in to bet');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const userId = formData.get('userId') as string;
  const marketId = formData.get('marketId') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const outcome = formData.get('outcome') as 'YES' | 'NO';
  const comment = formData.get('comment') as string;

  if (user.id !== userId) throw new Error('Identity verification failed');
  if (!marketId || isNaN(amount) || amount <= 0) {
    throw new Error('Invalid bet parameters');
  }

  // 2. Profile Insurance: Ensure the user has a profile record
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!profile) {
    await supabase.from('profiles').insert({
      id: user.id,
      username: user.email?.split('@')[0] || 'anonymous',
      credits: 0
    });
  }

  // 3. Fetch current market state
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

  if (rpcError) {
    console.error('RPC Error placing bet:', rpcError);
    throw new Error(rpcError.message);
  }

  // 4. Update the UI (Both home and detail page)
  revalidatePath('/');
  revalidatePath(`/markets/${marketId}`);
  
  return { success: true };
}
