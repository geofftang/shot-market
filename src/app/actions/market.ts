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
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // 1. Verify ownership and check for bets
  const { data: market, error: marketError } = await supabase
    .from('markets')
    .select('creator_id, bets(count)')
    .eq('id', marketId)
    .single();

  if (marketError || !market) throw new Error('Market not found');
  if (market.creator_id !== user.id) throw new Error('Only the creator can delete this market');
  
  const betCount = market.bets?.[0]?.count || 0;
  if (betCount > 0) {
    throw new Error('Cannot delete a market that already has bets. Settle it instead.');
  }

  // 2. Perform delete
  const { error: deleteError } = await supabase
    .from('markets')
    .delete()
    .eq('id', marketId);

  if (deleteError) throw new Error(deleteError.message);

  revalidatePath('/');
  redirect('/');
}
