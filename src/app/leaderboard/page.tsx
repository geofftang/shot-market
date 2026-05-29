import { createClient } from '@supabase/supabase-js';
import { Trophy, ArrowLeft, TrendingDown, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0; // Live data

export default async function LeaderboardPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('credits', { ascending: false });

  return (
    <main className="min-h-screen bg-black text-white p-8 font-sans pb-32">
      <div className="max-w-2xl mx-auto">
        
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-12 uppercase text-[10px] font-black tracking-widest">
          <ArrowLeft className="w-4 h-4" /> Back to Markets
        </Link>

        <header className="mb-16">
          <div className="flex items-center gap-3 text-emerald-500 font-black tracking-tighter text-sm uppercase mb-3 italic">
            <Trophy className="w-5 h-5" /> The Hall of Fame
          </div>
          <h1 className="text-6xl font-black tracking-tighter leading-none mb-4">
            Board of Board
          </h1>
          <p className="text-slate-400 text-lg font-medium">
            The oracles vs. the debtors. Total accountability.
          </p>
        </header>

        <div className="space-y-4">
          {profiles && profiles.length > 0 ? (
            profiles.map((profile, idx) => {
              const isDebtor = parseFloat(profile.credits) < 0;
              const isOracle = parseFloat(profile.credits) > 0;

              return (
                <div 
                  key={profile.id} 
                  className={`bg-white/5 border border-white/5 p-8 rounded-[2rem] flex items-center justify-between transition-all ${
                    idx === 0 ? 'border-emerald-500/20 bg-emerald-500/5' : ''
                  }`}
                >
                  <div className="flex items-center gap-6">
                    <span className="text-4xl font-black italic text-slate-800 tabular-nums">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <div className="text-xl font-black tracking-tight text-white mb-1">
                        @{profile.username}
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                        Active Trader
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-3xl font-mono font-black italic flex items-center gap-2 justify-end ${
                      isOracle ? 'text-emerald-500' : isDebtor ? 'text-rose-500' : 'text-slate-500'
                    }`}>
                      {isOracle && <TrendingUp className="w-4 h-4" />}
                      {isDebtor && <TrendingDown className="w-4 h-4" />}
                      {parseFloat(profile.credits).toFixed(1)}
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 mt-1">
                      SHOT BALANCE
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-20 text-slate-700 uppercase font-black tracking-widest text-sm">
              No souls recorded on the board yet.
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="mt-20 border-t border-white/5 pt-12 text-center">
          <p className="text-slate-600 text-[10px] uppercase font-black tracking-[0.4em] leading-loose max-w-sm mx-auto">
            Shot debt is a social contract. Settle up often. 
          </p>
        </div>

      </div>
    </main>
  );
}
