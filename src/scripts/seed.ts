import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log('🌱 Seeding Shot Market data...');

  // 1. Create System Profile
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ 
      id: '00000000-0000-0000-0000-000000000000', 
      username: 'system', 
      credits: 0 
    });

  if (profileError) {
    console.error('❌ Error creating system profile:', profileError.message);
    return;
  }
  console.log('✅ System profile created.');

  // 2. Create the David vs Shaun Market
  const { error: marketError } = await supabase
    .from('markets')
    .upsert({
      id: '11111111-1111-1111-1111-111111111111',
      question: "Will David answer Shaun's phone call?",
      description: "",
      creator_id: '00000000-0000-0000-0000-000000000000',
      yes_pool: 100,
      no_pool: 100,
      p: 0.5,
      status: 'open'
    });

  if (marketError) {
    console.error('❌ Error creating market:', marketError.message);
    return;
  }
  console.log('✅ David vs Shaun market created.');

  console.log('\n🚀 SEEDING COMPLETE. Refresh http://localhost:3000 to see the live market!');
}

seed();
