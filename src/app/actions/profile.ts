'use server'

import { createClient } from '@/utils/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function updateUsernameAction(formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const username = formData.get('username') as string;
  if (!username || username.length < 3) {
    throw new Error('Username must be at least 3 characters');
  }

  // Sanitize username (remove @, only alphanumeric and underscores)
  const cleanUsername = username.replace(/^@/, '').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();

  const { error } = await supabase
    .from('profiles')
    .upsert({ 
      id: user.id, 
      username: cleanUsername,
      credits: 0 // Starting balance for debt tracking
    }, {
      onConflict: 'id'
    });

  if (error) {
    if (error.code === '23505') throw new Error('Username is already taken');
    throw new Error(error.message);
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function updateWeightAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const weight = parseFloat(formData.get('weight') as string);
  if (isNaN(weight) || weight < 0.1 || weight > 10) {
    throw new Error('Weight must be between 0.1 and 10');
  }

  const { error } = await supabase
    .from('profiles')
    .update({ weight })
    .eq('id', user.id);

  if (error) throw new Error(error.message);

  revalidatePath('/', 'layout');
  revalidatePath('/leaderboard');
}

export async function settleUpAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const amount = parseFloat(formData.get('amount') as string);
  const comment = formData.get('comment') as string;

  if (isNaN(amount) || amount <= 0) {
    throw new Error('Invalid amount');
  }

  // 1. Record the settlement
  const { error: settleError } = await supabase
    .from('settlements')
    .insert({
      user_id: user.id,
      amount,
      comment: comment || 'Settled up shots'
    });

  if (settleError) throw new Error(settleError.message);

  // 2. Update the profile credits (add back)
  const { data: profile } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', user.id)
    .single();

  if (profile) {
    await supabase
      .from('profiles')
      .update({ credits: parseFloat(profile.credits) + amount })
      .eq('id', user.id);
  }

  revalidatePath('/', 'layout');
  revalidatePath('/leaderboard');
}
