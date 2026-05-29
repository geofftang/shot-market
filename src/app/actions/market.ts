'use server'

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function createMarketAction(formData: FormData) {
  // ... existing code
}

export async function deleteMarketAction(marketId: string) {
  // ... existing code
}

export async function resolveMarketAction(formData: FormData) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const marketId = formData.get('marketId') as string;
  const outcome = formData.get('outcome') as 'resolved_yes' | 'resolved_no';
  const reason = formData.get('reason') as string;

  if (!marketId || !outcome || !reason) throw new Error('Market ID, outcome, and reason are required');

  // 1. Verify ownership
  const { data: market, error: marketError } = await supabase
    .from('markets')
    .select('*')
    .eq('id', marketId)
    .single();

  if (marketError || !market) throw new Error('Market not found');
  if (market.creator_id !== user.id) throw new Error('Only the creator can resolve this market');
  if (market.status !== 'open') throw new Error('Market is already resolved');

  // 2. Fetch all winning bets
  const winningOutcome = outcome === 'resolved_yes' ? 'YES' : 'NO';
  const { data: winningBets, error: betsError } = await supabase
    .from('bets')
    .select('user_id, shares')
    .eq('market_id', marketId)
    .eq('outcome', winningOutcome);

  if (betsError) throw new Error(betsError.message);

  // 3. Payout winners & Close market (Transaction-like sequence)
  // In a real app, use a DB function/RPC for atomicity. 
  // For MVP, we'll loop and update.
  
  // Close the market first
  await supabase
    .from('markets')
    .update({ 
      status: outcome, 
      closed_at: new Date().toISOString(),
      description: market.description + `\n\nRESOLUTION: ${reason}` 
    })
    .eq('id', marketId);

  // Pay out each winner
  if (winningBets && winningBets.length > 0) {
    for (const bet of winningBets) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', bet.user_id)
        .single();
        
      if (profile) {
        await supabase
          .from('profiles')
          .update({ credits: parseFloat(profile.credits) + parseFloat(bet.shares) })
          .eq('id', bet.user_id);
      }
    }
  }

  revalidatePath('/');
  revalidatePath('/leaderboard');
  redirect('/');
}
