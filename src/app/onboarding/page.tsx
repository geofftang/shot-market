'use client'

import React, { useState } from 'react';
import { updateUsernameAction } from '@/app/actions/profile';
import { Beer, Loader2, AtSign } from 'lucide-react';

export default function OnboardingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 font-sans">
      <div className="w-full max-w-sm">
        
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="bg-emerald-500 p-2 rounded-xl">
            <Beer className="w-6 h-6 text-black" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic">Shot Caller</h1>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-10 rounded-[2rem] shadow-2xl">
          <header className="mb-10 text-center">
            <h2 className="text-2xl font-black tracking-tight mb-2">Claim Your Name</h2>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              This is how you&apos;ll appear on the Board of Shame. Choose wisely.
            </p>
          </header>

          <form 
            action={async (formData) => {
              setLoading(true);
              setError(null);
              try {
                await updateUsernameAction(formData);
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Something went wrong');
                setLoading(false);
              }
            }} 
            className="space-y-6"
          >
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1 text-center block w-full">Handle</label>
              <div className="relative">
                <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  name="username"
                  required
                  autoFocus
                  minLength={3}
                  maxLength={15}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-4 pl-12 pr-4 text-center text-xl font-black text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-800"
                  placeholder="shot_caller"
                />
              </div>
            </div>

            {error && (
              <p className="text-rose-500 text-xs font-bold text-center bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
                {error}
              </p>
            )}

            <button
              disabled={loading}
              className="w-full bg-white hover:bg-emerald-500 hover:text-black text-black font-black py-4 rounded-xl shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'SAVE HANDLE'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
