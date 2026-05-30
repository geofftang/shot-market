import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log('🌱 Seeding Shot Caller data...');

  // 1. Create System Profile
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ 
      id: '00000000-0000-0000-0000-000000000000', 
      username: 'system', 
      credits: 0,
      weight: 1.0
    });

  if (profileError) {
    console.error('❌ Error creating system profile:', profileError.message);
    return;
  }
  console.log('✅ System profile created.');

  // 2. Create the David vs Shaun Market
  const { data: market, error: marketError } = await supabase
    .from('markets')
    .upsert({
      id: '11111111-1111-1111-1111-111111111111',
      question: "Will David answer Shaun's phone call?",
      description: "Shaun is calling David 3 times. David usually ignores Shaun when he is gaming.",
      creator_id: '00000000-0000-0000-0000-000000000000',
      outcome_type: 'binary',
      status: 'open'
    })
    .select()
    .single();

  if (marketError || !market) {
    console.error('❌ Error creating market:', marketError?.message);
    return;
  }
  console.log('✅ David vs Shaun market created.');

  // 3. Create Answers for the market
  const { error: answersError } = await supabase
    .from('answers')
    .upsert([
      { 
        id: '22222222-2222-2222-2222-222222222222',
        market_id: market.id, 
        text: 'YES', 
        pool: 50 
      },
      { 
        id: '33333333-3333-3333-3333-333333333333',
        market_id: market.id, 
        text: 'NO', 
        pool: 50 
      }
    ]);

  if (answersError) {
    console.error('❌ Error creating answers:', answersError.message);
    return;
  }
  console.log('✅ Default answers (YES/NO) created.');

  console.log('\n🚀 SEEDING COMPLETE. Refresh http://localhost:3000 to see the live market!');
}

seed();
