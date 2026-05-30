import { createClient } from '@supabase/supabase-js';
import { ArrowLeft, TrendingDown, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0; // Live data

export default async function LeaderboardPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*');

  const { data: activeMarkets } = await supabase
    .from('markets')
    .select('id, yes_pool, no_pool, p')
    .eq('status', 'open');

  const { data: activeBets } = await supabase
    .from('bets')
    .select('user_id, market_id, outcome, shares')
    .in('market_id', activeMarkets?.map((m: any) => m.id) || []);

  const leaderboardData = (profiles || []).map((profile: any) => {
    const userBets = (activeBets || []).filter((b: any) => b.user_id === profile.id);
    const equity = userBets.reduce((acc: number, bet: any) => {
      const market = activeMarkets?.find((m: any) => m.id === bet.market_id);
      if (!market) return acc;
      
      const prob = (parseFloat(market.p) * parseFloat(market.no_pool)) / 
                   ((1 - parseFloat(market.p)) * parseFloat(market.yes_pool) + parseFloat(market.p) * parseFloat(market.no_pool));
      
      const value = bet.outcome === 'YES' ? parseFloat(bet.shares) * prob : parseFloat(bet.shares) * (1 - prob);
      return acc + value;
    }, 0);

    return {
      ...profile,
      netWorth: parseFloat(profile.credits) + equity
    };
  }).sort((a: any, b: any) => b.netWorth - a.netWorth);

  return (
    <main className="min-h-screen bg-black text-white p-8 font-sans pb-32">
      <div className="max-w-2xl mx-auto">
        
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-12 uppercase text-[10px] font-black tracking-widest">
          <ArrowLeft className="w-4 h-4" /> Back to Markets
        </Link>

        <header className="mb-16">
          <h1 className="text-8xl font-black tracking-tighter leading-none mb-4 italic">
            BOARD OF SHAME
          </h1>
        </header>

        <div className="space-y-4">
          {leaderboardData && leaderboardData.length > 0 ? (
            leaderboardData.map((profile: any, idx: number) => {
              const isDebtor = profile.netWorth < 0;
              const isOracle = profile.netWorth > 0;

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
                      <Link href={`/profile/${profile.username}`} className="text-xl font-black tracking-tight text-white mb-1 hover:text-emerald-500 transition-colors">
                        @{profile.username}
                      </Link>
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
                      {profile.netWorth.toFixed(1)}
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 mt-1">
                      NET WORTH (SHOTS)
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
