'use server'

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function createMarketAction(formData: FormData) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const question = formData.get('question') as string;
  const description = formData.get('description') as string;
  const initialLiquidity = parseFloat(formData.get('initialLiquidity') as string) || 100;
  const userId = formData.get('userId') as string || '00000000-0000-0000-0000-000000000000'; // Default system user for now

  if (!question) throw new Error('Question is required');

  const { data: market, error } = await supabase
    .from('markets')
    .insert({
      question,
      description,
      creator_id: userId,
      yes_pool: initialLiquidity,
      no_pool: initialLiquidity,
      p: 0.5,
      status: 'open'
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/');
  redirect('/');
}
