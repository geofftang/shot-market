'use server'

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient as createServerClient } from '@/utils/supabase/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function createMarketAction(formData: FormData) {
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const question = formData.get('question') as string;
  const description = formData.get('description') as string;
  const initialLiquidity = parseFloat(formData.get('initialLiquidity') as string) || 50;

  if (!question) throw new Error('Question is required');

  const { error } = await supabase
    .from('markets')
    .insert({
      question,
      description,
      creator_id: user.id,
      yes_pool: initialLiquidity,
      no_pool: initialLiquidity,
      p: 0.5,
      status: 'open'
    });

  if (error) throw new Error(error.message);

  revalidatePath('/');
  redirect('/');
}

export async function deleteMarketAction(marketId: string) {
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { error } = await supabase
    .from('markets')
    .delete()
    .eq('id', marketId)
    .eq('creator_id', user.id);

  if (error) throw new Error(error.message);

  revalidatePath('/');
}

export async function resolveMarketAction(formData: FormData) {
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
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

  // 3. Payout winners (using their personal weights)
  if (winningBets && winningBets.length > 0) {
    for (const bet of winningBets) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits, weight')
        .eq('id', bet.user_id)
        .single();
        
      if (profile) {
        const personalWeight = parseFloat(profile.weight || '1.0');
        const weightedPayout = parseFloat(bet.shares) * personalWeight;
        
        await supabase
          .from('profiles')
          .update({ credits: parseFloat(profile.credits) + weightedPayout })
          .eq('id', bet.user_id);
      }
    }
  }

  // 4. Close market
  await supabase
    .from('markets')
    .update({ 
      status: outcome, 
      closed_at: new Date().toISOString(),
      description: market.description + `\n\nRESOLUTION: ${reason}` 
    })
    .eq('id', marketId);

  revalidatePath('/');
  revalidatePath('/leaderboard');
  redirect('/');
}
