import { createClient } from '@/utils/supabase/server';
import { MarketChart } from '@/components/MarketChart';
import { BettingCard } from '@/components/BettingCard';
import Link from 'next/link';
import { TrendingUp, Users, PlusCircle, MessageSquare, Trash2 } from 'lucide-react';
import { getCpmmProbability, formatProbability } from '@/lib/engine/cpmm';
import { deleteMarketAction } from '@/app/actions/market';

export const revalidate = 0; // Disable cache for live data

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Fetch all open markets
  const { data: markets, error: marketError } = await supabase
    .from('markets')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  if (marketError || !markets || markets.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-bold mb-4">No active markets found.</h1>
        <Link href="/create" className="flex items-center gap-2 bg-emerald-500 px-6 py-3 rounded-xl font-bold hover:bg-emerald-400 transition-colors text-black">
          <PlusCircle className="w-5 h-5" /> Create First Market
        </Link>
      </div>
    );
  }

  const featuredMarket = markets[0];

  // 2. Fetch history for the featured market
  const { data: history } = await supabase
    .from('bets')
    .select('created_at, probability_at_bet, amount, outcome, comment, user_id')
    .eq('market_id', featuredMarket.id)
    .order('created_at', { ascending: true });

  const chartData = [
    { created_at: featuredMarket.created_at, probability: parseFloat(featuredMarket.p) },
    ...(history?.map(h => ({ created_at: h.created_at, probability: parseFloat(h.probability_at_bet) })) || [])
  ];

  const featuredVolume = history?.reduce((acc, b) => acc + parseFloat(b.amount), 0) || 0;

  return (
    <main className="min-h-screen bg-black text-white p-8 font-sans selection:bg-emerald-500/30 pb-32">
      <div className="max-w-6xl mx-auto">
        
        {/* RESTORED BOLD HEADER */}
        <header className="mb-16 flex justify-between items-end border-b border-white/10 pb-12">
          <div className="flex-1">
            <div className="text-emerald-500 font-black tracking-tighter text-sm uppercase mb-3 italic">
              Live Market
            </div>
            <h1 className="text-6xl font-black tracking-tighter leading-[0.9] mb-4 max-w-4xl text-balance">
              {featuredMarket.question}
            </h1>
            {featuredMarket.creator_id === user?.id && featuredVolume === 0 && (
              <form action={deleteMarketAction.bind(null, featuredMarket.id)}>
                <button className="flex items-center gap-2 text-rose-500 hover:text-rose-400 text-[10px] font-black uppercase tracking-widest transition-colors mb-4">
                  <Trash2 className="w-3 h-3" /> Delete Market
                </button>
              </form>
            )}
            {featuredMarket.description && (
              <p className="text-slate-400 text-xl max-w-2xl font-medium">
                {featuredMarket.description}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-balance">Total Volume</div>
            <div className="text-4xl font-mono font-black text-white whitespace-nowrap">{featuredVolume.toFixed(1)} SHOTS</div>
          </div>
        </header>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start mb-24">
          <div className="lg:col-span-2 space-y-12">
            <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-10 backdrop-blur-xl shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Market Probability</h2>
                <div className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Real-time Feed</div>
              </div>
              <MarketChart history={chartData} />
            </div>

            {/* RECENT ACTIVITY / TRASH TALK */}
            <div className="space-y-6">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2">
                <MessageSquare className="w-3 h-3" /> Recent Activity
              </h2>
              <div className="space-y-3">
                {history && history.length > 0 ? (
                  history.slice().reverse().map((bet, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/5 p-6 rounded-2xl flex flex-col gap-2">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                        <span className={bet.outcome === 'YES' ? 'text-emerald-400' : 'text-rose-400'}>
                          {bet.outcome} {parseFloat(bet.amount).toFixed(1)} SHOTS
                        </span>
                        <span className="text-slate-600">
                          {new Date(bet.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {bet.comment && (
                        <p className="text-slate-300 text-sm italic font-medium leading-relaxed">
                          "{bet.comment}"
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-700 text-xs uppercase font-black tracking-widest text-center py-8">
                    No bets yet. Be the first.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-8 sticky top-32">
            <BettingCard 
              marketId={featuredMarket.id}
              userId="00000000-0000-0000-0000-000000000000"
              initialPool={{ YES: parseFloat(featuredMarket.yes_pool), NO: parseFloat(featuredMarket.no_pool) }}
              p={parseFloat(featuredMarket.p)}
            />
          </div>
        </div>

        {/* SUBTLE DISCOVERY SECTION */}
        {markets.length > 1 && (
          <section className="border-t border-white/5 pt-20">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-4xl font-black tracking-tighter mb-2">Other Markets</h2>
                <p className="text-slate-500 font-medium text-balance">Browse active group bets.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {markets.slice(1).map((m) => {
                const prob = getCpmmProbability({ YES: parseFloat(m.yes_pool), NO: parseFloat(m.no_pool) }, parseFloat(m.p));
                return (
                  <Link 
                    key={m.id} 
                    href={`/markets/${m.id}`}
                    className="group bg-white/5 border border-white/5 p-8 rounded-[2rem] hover:bg-white/10 hover:border-emerald-500/50 transition-all shadow-xl"
                  >
                    <div className="flex justify-between items-start gap-6 mb-6">
                      <h3 className="font-black text-2xl tracking-tight leading-none group-hover:text-emerald-400 transition-colors text-balance">
                        {m.question}
                      </h3>
                      <div className="text-3xl font-black font-mono text-emerald-500 italic">
                        {formatProbability(prob)}
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-[10px] text-slate-600 font-black uppercase tracking-widest">
                      <div className="flex items-center gap-2">
                        <Users className="w-3 h-3" /> Traders
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-3 h-3" /> {(parseFloat(m.yes_pool) + parseFloat(m.no_pool) - 200).toFixed(1)} Volume
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
