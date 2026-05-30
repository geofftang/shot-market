import { createClient } from '@/utils/supabase/server';
import { MarketChart } from '@/components/MarketChart';
import { BettingCard } from '@/components/BettingCard';
import Link from 'next/link';
import { MessageSquare, Trash2, ArrowLeft } from 'lucide-react';
import { deleteMarketAction, resolveMarketAction } from '@/app/actions/market';
import { CheckCircle2, XCircle } from 'lucide-react';
import { notFound } from 'next/navigation';
import { RealtimePulse } from '@/components/RealtimePulse';
import { SettlementUtility } from '@/components/SettlementUtility';

export const revalidate = 0; // Disable cache for live data

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MarketPage({ params }: PageProps) {
  const { id: marketId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Fetch the specific market with its options
  const { data: market, error: marketError } = await supabase
    .from('markets')
    .select('*, answers(*)')
    .eq('id', marketId)
    .single();

  if (marketError || !market) {
    return notFound();
  }

  const answers = market.answers || [];

  // 2. Fetch history for this market
  const { data: history } = await supabase
    .from('bets')
    .select('created_at, probability_at_bet, amount, outcome, comment, user_id, answer_id')
    .eq('market_id', market.id)
    .order('created_at', { ascending: true });

  const firstAnswerId = answers[0]?.id;
  const chartData = [
    { created_at: market.created_at, probability: 0.5 },
    ...(history?.filter(h => h.answer_id === firstAnswerId).map(h => ({ 
      created_at: h.created_at, 
      probability: parseFloat(h.probability_at_bet) 
    })) || [])
  ];

  const volume = history?.reduce((acc, b) => acc + parseFloat(b.amount), 0) || 0;

  return (
    <main className="min-h-screen bg-black text-white p-8 font-sans selection:bg-emerald-500/30 pb-32">
      <RealtimePulse marketId={market.id} />
      <div className="max-w-6xl mx-auto">
        
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-12 uppercase text-[10px] font-black tracking-widest">
          <ArrowLeft className="w-4 h-4" /> Back to Markets
        </Link>

        {/* BOLD HEADER */}
        <header className="mb-16 flex justify-between items-end border-b border-white/10 pb-12">
          <div className="flex-1">
            <div className="text-emerald-500 font-black tracking-tighter text-sm uppercase mb-3 italic">
              {market.status === 'open' ? 'Live Market' : 'Resolved Market'}
            </div>
            <h1 className="text-6xl font-black tracking-tighter leading-[0.9] mb-4 max-w-4xl text-balance">
              {market.question}
            </h1>
            {market.creator_id === user?.id && volume === 0 && market.status === 'open' && (
              <form action={deleteMarketAction.bind(null, market.id)}>
                <button className="flex items-center gap-2 text-rose-500 hover:text-rose-400 text-[10px] font-black uppercase tracking-widest transition-colors mb-4">
                  <Trash2 className="w-3 h-3" /> Delete Market
                </button>
              </form>
            )}
            {market.description && (
              <p className="text-slate-400 text-xl max-w-2xl font-medium">
                {market.description}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-balance">Total Volume</div>
            <div className="text-4xl font-mono font-black text-white whitespace-nowrap">{volume.toFixed(1)} SHOTS</div>
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
                          &quot;{bet.comment}&quot;
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
            {market.status === 'open' ? (
              <>
                <BettingCard 
                  marketId={market.id}
                  userId={user?.id || null}
                  answers={answers.map((a: any) => ({ id: a.id, text: a.text, pool: parseFloat(a.pool) }))}
                  outcomeType={market.outcome_type}
                />

                {/* DISCRETE SETTLEMENT CONTROLS (For Creator) */}
                {market.creator_id === user?.id && (
                  <SettlementUtility marketId={market.id} answers={answers.map((a: any) => ({ id: a.id, text: a.text }))} />
                )}
              </>
            ) : (
              <div className="bg-slate-900 border border-white/5 p-8 rounded-[2rem] shadow-2xl text-center">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">
                  Market Closed
                </div>
                <div className={`text-2xl font-black italic uppercase tracking-tighter ${
                  answers.find(a => a.is_winner)?.text === 'YES' ? 'text-emerald-500' : 'text-rose-500'
                }`}>
                  Resolved {answers.find(a => a.is_winner)?.text || 'UNKNOWN'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
