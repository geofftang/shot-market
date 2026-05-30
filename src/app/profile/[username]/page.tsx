import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, TrendingDown, Beer, History, PlusCircle, Settings2, Info } from 'lucide-react';
import { settleUpAction, updateWeightAction } from '@/app/actions/profile';

export const revalidate = 0;

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: PageProps) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  // 1. Fetch Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (!profile) return notFound();

  const isOwnProfile = authUser?.id === profile.id;
  const personalWeight = parseFloat(profile.weight || '1.0');

  // 2. Fetch Bets & Open Markets for Equity
  const { data: bets } = await supabase
    .from('bets')
    .select('*, markets(question, yes_pool, no_pool, p, status)')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false });

  const { data: settlements } = await supabase
    .from('settlements')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false });

  // 3. Calculate Stats (Units vs Shots)
  const activeBets = (bets || []).filter(b => b.markets.status === 'open');
  const unitEquity = activeBets.reduce((acc, bet) => {
    const market = bet.markets;
    const prob = (parseFloat(market.p) * parseFloat(market.no_pool)) / 
                 ((1 - parseFloat(market.p)) * parseFloat(market.yes_pool) + parseFloat(market.p) * parseFloat(market.no_pool));
    const value = bet.outcome === 'YES' ? parseFloat(bet.shares) * prob : parseFloat(bet.shares) * (1 - prob);
    return acc + value;
  }, 0);

  const shotEquity = unitEquity * personalWeight;
  const netWorthShots = parseFloat(profile.credits) + shotEquity;
  const totalVolumeUnits = (bets || []).reduce((acc, b) => acc + parseFloat(b.amount), 0);

  // 4. Merge History
  const history = [
    ...(bets || []).map(b => ({ ...b, type: 'BET' })),
    ...(settlements || []).map(s => ({ ...s, type: 'SETTLEMENT' }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <main className="min-h-screen bg-black text-white p-8 font-sans pb-32">
      <div className="max-w-4xl mx-auto">
        
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-12 uppercase text-[10px] font-black tracking-widest">
          <ArrowLeft className="w-4 h-4" /> Back to Markets
        </Link>

        {/* PROFILE HEADER */}
        <header className="mb-16 flex justify-between items-start">
          <div>
            <div className="text-emerald-500 font-black tracking-tighter text-sm uppercase mb-3 italic">
              User Profile
            </div>
            <h1 className="text-7xl font-black tracking-tighter leading-none mb-4 italic">
              @{profile.username}
            </h1>
            <div className="flex items-center gap-4">
              <p className="text-slate-500 uppercase text-[10px] font-black tracking-[0.3em]">
                Joined {new Date(profile.created_at).toLocaleDateString()}
              </p>
              <div className="h-4 w-[1px] bg-white/10" />
              <p className="text-emerald-500/60 uppercase text-[10px] font-black tracking-[0.3em]">
                Voice: 1 Unit = {personalWeight} Shots
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`text-6xl font-mono font-black italic ${netWorthShots >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {netWorthShots.toFixed(1)}
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 mt-2">
              NET WORTH (SHOTS)
            </div>
          </div>
        </header>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-16">
          <div className="bg-slate-900/50 border border-white/5 p-6 rounded-[2rem]">
            <div className="text-slate-600 text-[10px] font-black uppercase tracking-widest mb-3">Debt (Shots)</div>
            <div className="text-2xl font-black font-mono">{parseFloat(profile.credits).toFixed(1)}</div>
          </div>
          <div className="bg-slate-900/50 border border-white/5 p-6 rounded-[2rem]">
            <div className="text-slate-600 text-[10px] font-black uppercase tracking-widest mb-3">Equity (Shots)</div>
            <div className="text-2xl font-black font-mono text-emerald-500">+{shotEquity.toFixed(1)}</div>
          </div>
          <div className="bg-slate-900/50 border border-white/5 p-6 rounded-[2rem]">
            <div className="text-slate-600 text-[10px] font-black uppercase tracking-widest mb-3">Conviction (Units)</div>
            <div className="text-2xl font-black font-mono text-blue-400">{unitEquity.toFixed(1)}</div>
          </div>
          <div className="bg-slate-900/50 border border-white/5 p-6 rounded-[2rem]">
            <div className="text-slate-600 text-[10px] font-black uppercase tracking-widest mb-3">Volume (Units)</div>
            <div className="text-2xl font-black font-mono">{totalVolumeUnits.toFixed(0)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* HISTORY SECTION */}
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2">
              <History className="w-3 h-3" /> Ledger of Shame
            </h2>
            
            <div className="space-y-4">
              {history.length > 0 ? (
                history.map((item: any, idx) => {
                  const isBet = item.type === 'BET';
                  const displayAmount = isBet ? parseFloat(item.amount) : parseFloat(item.amount);
                  const displayShots = isBet ? (displayAmount * personalWeight).toFixed(1) : displayAmount.toFixed(1);

                  return (
                    <div key={idx} className="bg-white/5 border border-white/5 p-6 rounded-2xl">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-3">
                          {isBet ? (
                            <span className={`text-[10px] font-black px-2 py-1 rounded-md ${item.outcome === 'YES' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                              BET {item.outcome}
                            </span>
                          ) : (
                            <span className="text-[10px] font-black px-2 py-1 rounded-md bg-blue-500/10 text-blue-400">
                              SETTLED
                            </span>
                          )}
                          <span className="text-slate-600 text-[10px] font-black uppercase tracking-widest">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className={`font-mono font-black ${isBet ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {isBet ? '-' : '+'}{displayShots} <span className="text-[10px] font-black uppercase ml-1">Shots</span>
                          </div>
                          {isBet && (
                            <div className="text-[9px] text-slate-600 font-black uppercase tracking-tighter">
                              ({displayAmount} Units)
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-sm font-bold text-slate-200 mb-1">
                        {isBet ? item.markets?.question : item.comment}
                      </p>
                      {isBet && item.comment && (
                        <p className="text-xs italic text-slate-500">&quot;{item.comment}&quot;</p>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                  <p className="text-slate-700 text-xs font-black uppercase tracking-widest">No history yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* SETTINGS & ACTIONS (SIDEBAR) */}
          <div className="space-y-8">
            {/* VOICE TUNING SECTION */}
            {isOwnProfile && (
              <div className="bg-blue-500/5 border border-blue-500/20 p-8 rounded-[2rem] shadow-2xl">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-6 flex items-center gap-2">
                  <Settings2 className="w-4 h-4" /> Voice Tuning
                </h3>
                <p className="text-[10px] text-slate-400 mb-6 leading-relaxed flex gap-2">
                  <Info className="w-3 h-3 shrink-0 mt-0.5" />
                  Equalize your power. If you drink less than Shaun, lower this value so your bets move the market the same as his.
                </p>
                <form action={updateWeightAction} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-600 mb-2">1 Unit = X Shots</label>
                    <div className="relative">
                      <input 
                        name="weight"
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="10"
                        defaultValue={personalWeight}
                        required
                        className="w-full bg-black border border-white/10 rounded-xl p-4 text-xl font-mono text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 font-black text-[10px] uppercase">
                        Multiplier
                      </div>
                    </div>
                  </div>
                  <button className="w-full bg-blue-500 hover:bg-blue-400 text-white font-black py-4 rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-95">
                    Save Voice Weight
                  </button>
                </form>
              </div>
            )}

            {/* SETTLE UP SECTION */}
            {isOwnProfile && parseFloat(profile.credits) < 0 && (
              <div className="bg-emerald-500/5 border border-emerald-500/20 p-8 rounded-[2rem] shadow-2xl">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 mb-6 flex items-center gap-2">
                  <Beer className="w-4 h-4" /> Settle Up
                </h3>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  Bought a round or took your shots? Log it here to clear your debt.
                </p>
                <form action={settleUpAction} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-600 mb-2">Amount (Shots)</label>
                    <input 
                      name="amount"
                      type="number"
                      step="0.5"
                      required
                      placeholder="Shots paid..."
                      className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-600 mb-2">Comment</label>
                    <input 
                      name="comment"
                      placeholder="e.g. Bought a round at the pub"
                      className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2">
                    <PlusCircle className="w-4 h-4" /> Confirm Settlement
                  </button>
                </form>
              </div>
            )}
            
            {/* ACTIVE POSITIONS */}
            <div className="bg-slate-900 border border-white/5 p-8 rounded-[2rem]">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6">Active Positions</h3>
              <div className="space-y-4">
                {activeBets.length > 0 ? (
                  activeBets.map((bet: any, idx) => (
                    <Link href={`/markets/${bet.market_id}`} key={idx} className="block group">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-black text-slate-400 truncate max-w-[120px]">
                          {bet.markets.question}
                        </span>
                        <span className={`text-[10px] font-black ${bet.outcome === 'YES' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {bet.outcome} {parseFloat(bet.shares).toFixed(1)} <span className="text-[8px] opacity-50 uppercase ml-0.5">Units</span>
                        </span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500/50 w-1/2 group-hover:bg-emerald-500 transition-all" />
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">No active bets.</p>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
