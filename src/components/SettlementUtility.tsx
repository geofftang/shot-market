'use client'

import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { resolveMarketAction } from '@/app/actions/market';

interface Answer {
  id: string;
  text: string;
}

interface SettlementUtilityProps {
  marketId: string;
  answers: Answer[];
}

export function SettlementUtility({ marketId, answers }: SettlementUtilityProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <div className="flex justify-center pt-8">
        <button 
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 text-rose-500/30 hover:text-rose-500 transition-all text-[9px] font-black uppercase tracking-[0.4em] group"
        >
          <AlertCircle className="w-3 h-3 opacity-20 group-hover:opacity-100" />
          Market Settlement
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 p-8 bg-rose-500/[0.02] border border-rose-500/10 rounded-[2.5rem] relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-[50px] -mr-16 -mt-16" />
      
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-500">Critical Resolution</h3>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-slate-600 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form action={resolveMarketAction} className="space-y-4 relative z-10">
        <input type="hidden" name="marketId" value={marketId} />
        
        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase text-slate-700 ml-2 tracking-widest">Resolution Proof</label>
          <textarea 
            name="reason"
            required
            placeholder="Link to proof or final explanation..."
            className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-rose-500/50 placeholder:text-slate-800 resize-none"
          />
        </div>

        <div className="space-y-3">
          <label className="text-[9px] font-black uppercase text-slate-700 ml-2 tracking-widest">Select Decisive Winner</label>
          <div className="grid grid-cols-1 gap-2">
            {answers.map((a) => (
              <button 
                key={a.id}
                name="winnerId"
                value={a.id}
                className="group flex items-center justify-between bg-white/5 border border-white/5 hover:border-rose-500/30 px-5 py-4 rounded-xl transition-all active:scale-95 text-left"
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-rose-500">{a.text} WINS</span>
                <CheckCircle2 className="w-4 h-4 text-slate-900 group-hover:text-rose-500 transition-colors" />
              </button>
            ))}
          </div>
        </div>

        <p className="text-[8px] text-slate-600 font-bold uppercase text-center mt-4 tracking-tighter italic">
          Warning: Resolution is permanent and will payout all winners.
        </p>
      </form>
    </div>
  );
}
