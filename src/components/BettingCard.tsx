'use client'

import React, { useState, useMemo, useEffect } from 'react';
import { calculateMultiPurchase, getMultiProbability, formatProbability, MultiPool, getMultiProbabilities } from '@/lib/engine/cpmm';
import { placeBetAction } from '@/app/actions/bet';
import { TrendingUp, TrendingDown, Info, AlertTriangle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface Answer {
  id: string;
  text: string;
  pool: number;
}

interface BettingCardProps {
  marketId: string;
  userId: string | null;
  answers: Answer[];
  outcomeType: string;
}

export function BettingCard({ marketId, userId, answers, outcomeType }: BettingCardProps) {
  const [amount, setAmount] = useState<string>('5');
  const [selectedAnswerId, setSelectedAnswerId] = useState<string>(answers[0]?.id || '');
  const [comment, setComment] = useState<string>('');
  const [isPending, setIsPending] = useState(false);
  const [userCredits, setUserCredits] = useState<number | null>(null);

  const supabase = useMemo(() => createClient(), []);

  // Fetch user credits for the debt ceiling check
  useEffect(() => {
    if (userId) {
      const fetchCredits = async () => {
        const { data } = await supabase.from('profiles').select('credits').eq('id', userId).single();
        if (data) setUserCredits(parseFloat(data.credits));
      };
      fetchCredits();
    }
  }, [userId, supabase]);

  // Derived state: calculate preview
  const numAmount = parseFloat(amount);
  const pool: MultiPool = useMemo(() => {
    const p: MultiPool = {};
    answers.forEach(a => p[a.id] = a.pool);
    return p;
  }, [answers]);

  const preview = useMemo(() => {
    if (!selectedAnswerId || isNaN(numAmount) || numAmount <= 0) return null;
    return calculateMultiPurchase(pool, selectedAnswerId, numAmount);
  }, [pool, selectedAnswerId, numAmount]);
    
  const currentProbs = useMemo(() => getMultiProbabilities(pool), [pool]);
  const newProbs = useMemo(() => preview ? getMultiProbabilities(preview.newPool) : null, [preview]);

  const isCutOff = userCredits !== null && userCredits < -20;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white">Place Bet</h3>
        {userId && (
          <div className={`text-[10px] font-black px-3 py-1 rounded-full ${isCutOff ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-slate-800 text-slate-400'}`}>
            Balance: {userCredits?.toFixed(1) || '0.0'}
          </div>
        )}
      </div>

      {isCutOff && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
          <div className="text-[10px] text-rose-200 leading-relaxed font-bold uppercase tracking-tight">
            You are cut off! Your debt is too high (-20 shots). Settle up your tab to keep calling shots.
          </div>
        </div>
      )}

      {/* Outcome Selection */}
      <div className="mb-6">
        <label className="block text-[10px] font-black uppercase text-slate-500 mb-3 tracking-widest">Select Outcome</label>
        {outcomeType === 'binary' ? (
          <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800">
            {answers.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedAnswerId(a.id)}
                className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                  selectedAnswerId === a.id 
                    ? (a.text === 'YES' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-rose-500 text-white shadow-lg') 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {a.text}
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {answers.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedAnswerId(a.id)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex justify-between items-center ${
                  selectedAnswerId === a.id 
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                }`}
              >
                <span className="font-bold text-sm">{a.text}</span>
                <span className="font-mono text-xs opacity-60">{formatProbability(currentProbs[a.id])}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Amount Input */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-slate-400">Amount (Shots)</label>
          <div className="group relative">
            <Info className="w-3 h-3 text-slate-600 cursor-help" />
            <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-800 text-[10px] text-slate-300 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-white/5 shadow-2xl">
              1 Shot moves the market the same for everyone, but costs you real drinks based on your personal weight.
            </div>
          </div>
        </div>
        <div className="relative">
          <input
            type="number"
            step="0.1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isCutOff}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-4 px-4 text-2xl font-mono text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            placeholder="0"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold uppercase text-xs tracking-widest">
            SHOTS
          </div>
        </div>
      </div>

      {/* Trash Talk Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-400 mb-2">Reason / Trash Talk</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={isCutOff}
          placeholder="Why this bet?"
          rows={2}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-700 resize-none disabled:opacity-30"
        />
      </div>

      {/* Preview Section */}
      {preview && !isCutOff && (
        <div className="space-y-3 mb-8 p-4 bg-slate-950/50 rounded-xl border border-slate-800/50">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Potential Payout
            </span>
            <span className="text-emerald-400 font-bold font-mono">
              {preview.shares.toFixed(1)} Shots
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" /> New Probability
            </span>
            <span className="text-slate-300 font-mono">
              {newProbs ? formatProbability(newProbs[selectedAnswerId]) : '-'}
            </span>
          </div>
        </div>
      )}

      {/* Submit Button */}
      {!userId ? (
        <a
          href="/login"
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-xl shadow-xl transition-all active:scale-95 flex items-center justify-center"
        >
          SIGN IN TO BET
        </a>
      ) : (
        <form action={async (formData) => {
          setIsPending(true);
          try {
            await placeBetAction(formData);
            setComment('');
          } catch (e) {
            alert(e instanceof Error ? e.message : 'Failed to place bet');
          } finally {
            setIsPending(false);
          }
        }}>
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="marketId" value={marketId} />
          <input type="hidden" name="answerId" value={selectedAnswerId} />
          <input type="hidden" name="amount" value={amount} />
          <input type="hidden" name="outcome" value={answers.find(a => a.id === selectedAnswerId)?.text || ''} />
          <input type="hidden" name="comment" value={comment} />
          
          <button
            disabled={isPending || isCutOff || !amount || parseFloat(amount) <= 0}
            className="w-full bg-white hover:bg-slate-200 text-slate-950 font-black py-4 rounded-xl shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isPending ? 'PLACING BET...' : isCutOff ? 'CUT OFF' : 'CONFIRM BET'}
          </button>
        </form>
      )}

      <p className="mt-4 text-[10px] text-slate-600 flex items-center gap-1 justify-center uppercase tracking-widest">
        <Info className="w-3 h-3" /> Trades are final. Drink responsibly.
      </p>
    </div>
  );
}
