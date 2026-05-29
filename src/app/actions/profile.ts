'use server'

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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
    .update({ username: cleanUsername })
    .eq('id', user.id);

  if (error) {
    if (error.code === '23505') throw new Error('Username is already taken');
    throw new Error(error.message);
  }

  revalidatePath('/', 'layout');
  redirect('/');
}
