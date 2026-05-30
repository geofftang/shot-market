'use server'

import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { calculateMultiPurchase, getMultiProbability, MultiPool } from '@/lib/engine/cpmm';
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
  const answerId = formData.get('answerId') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const comment = formData.get('comment') as string;

  if (user.id !== userId) throw new Error('Identity verification failed');
  if (!marketId || !answerId || isNaN(amount) || amount <= 0) {
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

  // 3. Fetch current market state (All answers)
  const { data: answers, error: answersError } = await supabase
    .from('answers')
    .select('*')
    .eq('market_id', marketId);

  if (answersError || !answers || answers.length === 0) {
    throw new Error('Market options not found');
  }

  const selectedAnswer = answers.find(a => a.id === answerId);
  if (!selectedAnswer) throw new Error('Selected option not found');

  const pool: MultiPool = {};
  answers.forEach(a => pool[a.id] = parseFloat(a.pool));
  
  // 4. Calculate the trade using the multi-engine
  const { shares, newPool } = calculateMultiPurchase(pool, answerId, amount);
  const newProbability = getMultiProbability(newPool, answerId);

  // 5. Execute the atomic RPC call
  const { error: rpcError } = await supabase.rpc('place_bet', {
    p_user_id: userId,
    p_market_id: marketId,
    p_answer_id: answerId,
    p_amount: amount,
    p_outcome: selectedAnswer.text,
    p_shares: shares,
    p_probability_at_bet: newProbability,
    p_new_pools: newPool,
    p_comment: comment || null
  });

  if (rpcError) {
    if (rpcError.message.includes('DEBT_CEILING_REACHED')) {
      throw new Error('Debt ceiling reached (-20 shots). Settle up to keep betting.');
    }
    console.error('RPC Error placing bet:', rpcError);
    throw new Error(rpcError.message);
  }

  // 6. Update the UI
  revalidatePath('/');
  revalidatePath(`/markets/${marketId}`);
  revalidatePath(`/profile/${user.id}`);
  
  return { success: true };
}
