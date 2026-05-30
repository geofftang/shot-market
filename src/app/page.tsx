import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { TrendingUp, Users, PlusCircle } from 'lucide-react';
import { getMultiProbability, formatProbability } from '@/lib/engine/cpmm';

export const revalidate = 0; // Disable cache for live data

export default async function Home() {
  const supabase = await createClient();

  // 1. Fetch all open markets with their options
  const { data: markets, error: marketError } = await supabase
    .from('markets')
    .select('*, answers(*)')
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  if (marketError || !markets || markets.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-bold mb-4 italic uppercase tracking-tighter text-slate-500">No active shots to call.</h1>
        <Link href="/create" className="flex items-center gap-2 bg-emerald-500 px-8 py-4 rounded-2xl font-black hover:bg-emerald-400 transition-all text-black uppercase tracking-widest active:scale-95 shadow-2xl shadow-emerald-500/20">
          <PlusCircle className="w-6 h-6" /> Create First Market
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-8 font-sans selection:bg-emerald-500/30 pb-32">
      <div className="max-w-6xl mx-auto">
        
        {/* HERO HEADER */}
        <header className="mb-20">
          <div className="text-emerald-500 font-black tracking-tighter text-sm uppercase mb-3 italic">
            Live Feed
          </div>
          <div className="flex justify-between items-end gap-12 border-b border-white/10 pb-12">
            <h1 className="text-8xl font-black tracking-tighter leading-[0.85] italic max-w-2xl">
              ACTIVE MARKETS
            </h1>
            <div className="text-right pb-2">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Got a theory?</p>
              <Link href="/create" className="bg-white hover:bg-emerald-500 hover:text-black text-black font-black px-6 py-3 rounded-full text-[10px] uppercase tracking-widest transition-all">
                + Launch Market
              </Link>
            </div>
          </div>
        </header>

        {/* MARKET GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {markets.map((m: any) => {
            const answers = m.answers || [];
            const firstAnswer = answers[0];
            const pool: any = {};
            answers.forEach((a: any) => pool[a.id] = parseFloat(a.pool));
            const prob = firstAnswer ? getMultiProbability(pool, firstAnswer.id) : 0.5;

            return (
              <Link 
                key={m.id} 
                href={`/markets/${m.id}`}
                className="group relative bg-slate-900/40 border border-white/5 p-10 rounded-[3rem] hover:bg-slate-900/60 hover:border-emerald-500/30 transition-all duration-500 shadow-2xl flex flex-col justify-between min-h-[320px]"
              >
                {/* Decorative Accent */}
                <div className="absolute top-0 left-12 w-12 h-[2px] bg-emerald-500/50 group-hover:w-24 transition-all duration-500" />
                
                <div>
                  <div className="flex justify-between items-start gap-6 mb-8">
                    <h3 className="font-black text-3xl tracking-tight leading-[0.95] group-hover:text-emerald-400 transition-colors text-balance">
                      {m.question}
                    </h3>
                  </div>
                  
                  {/* Probability Bar */}
                  <div className="space-y-3 mb-8">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                      <span>{firstAnswer?.text || 'YES'}</span>
                      <span className="text-emerald-500">{formatProbability(prob)}</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000" 
                        style={{ width: `${prob * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 text-[9px] text-slate-600 font-black uppercase tracking-[0.2em]">
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3 text-slate-800" /> {answers.length} Options
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3 h-3 text-slate-800" /> Live
                    </div>
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                    Bet Now →
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
