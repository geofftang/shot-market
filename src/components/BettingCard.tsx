'use client'

import React, { useState, useEffect } from 'react';
import { calculateCpmmPurchase, formatProbability, getCpmmProbability } from '@/lib/engine/cpmm';
import { placeBetAction } from '@/app/actions/bet';
import { TrendingUp, TrendingDown, Info } from 'lucide-react';

interface BettingCardProps {
  marketId: string;
  userId: string;
  initialPool: { YES: number; NO: number };
  p: number;
}

export function BettingCard({ marketId, userId, initialPool, p }: BettingCardProps) {
  const [amount, setAmount] = useState<string>('5');
  const [outcome, setOutcome] = useState<'YES' | 'NO'>('YES');
  const [comment, setComment] = useState<string>('');
  const [preview, setPreview] = useState<{ shares: number; newProb: number } | null>(null);
  const [isPending, setIsPending] = useState(false);

  // Update preview whenever amount or outcome changes
  useEffect(() => {
    const numAmount = parseFloat(amount);
    if (!isNaN(numAmount) && numAmount > 0) {
      const { shares, newPool } = calculateCpmmPurchase(initialPool, p, numAmount, outcome);
      const newProb = getCpmmProbability(newPool, p);
      setPreview({ shares, newProb });
    } else {
      setPreview(null);
    }
  }, [amount, outcome, initialPool, p]);

  const currentProb = getCpmmProbability(initialPool, p);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white">Place Bet</h3>
        <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full">
          <span className="text-sm text-slate-400">Current:</span>
          <span className="text-sm font-mono font-bold text-emerald-400">
            {formatProbability(currentProb)}
          </span>
        </div>
      </div>

      {/* Outcome Toggle */}
      <div className="flex p-1 bg-slate-950 rounded-xl mb-6 border border-slate-800">
        <button
          onClick={() => setOutcome('YES')}
          className={`flex-1 py-3 rounded-lg font-bold transition-all ${
            outcome === 'YES' 
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          YES
        </button>
        <button
          onClick={() => setOutcome('NO')}
          className={`flex-1 py-3 rounded-lg font-bold transition-all ${
            outcome === 'NO' 
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          NO
        </button>
      </div>

      {/* Amount Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-400 mb-2">Amount (Shots)</label>
        <div className="relative">
          <input
            type="number"
            step="0.1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-4 px-4 text-2xl font-mono text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
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
          placeholder="Why this bet?"
          rows={2}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-700 resize-none"
        />
      </div>

      {/* Preview Section */}
      {preview && (
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
              {formatProbability(preview.newProb)}
            </span>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <form action={async (formData) => {
        setIsPending(true);
        try {
          await placeBetAction(formData);
          setComment(''); // Clear comment on success
        } catch (e) {
          alert(e instanceof Error ? e.message : 'Failed to place bet');
        } finally {
          setIsPending(false);
        }
      }}>
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="marketId" value={marketId} />
        <input type="hidden" name="amount" value={amount} />
        <input type="hidden" name="outcome" value={outcome} />
        <input type="hidden" name="comment" value={comment} />
        
        <button
          disabled={isPending || !amount || parseFloat(amount) <= 0}
          className="w-full bg-white hover:bg-slate-200 text-slate-950 font-black py-4 rounded-xl shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
        >
          {isPending ? 'PLACING BET...' : 'CONFIRM BET'}
        </button>
      </form>

      <p className="mt-4 text-[10px] text-slate-600 flex items-center gap-1 justify-center uppercase tracking-widest">
        <Info className="w-3 h-3" /> Trades are final. Drink responsibly.
      </p>
    </div>
  );
}
