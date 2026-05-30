'use client'

import React, { useState } from 'react';
import { createMarketAction } from '@/app/actions/market';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function CreateMarketPage() {
  const [isPending, setIsPending] = useState(false);

  return (
    <main className="min-h-screen bg-black text-white p-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-12">
          <ArrowLeft className="w-4 h-4" /> Back to Markets
        </Link>

        <header className="mb-12">
          <h1 className="text-5xl font-black tracking-tight leading-none mb-4">
            Create a Market
          </h1>
          <p className="text-slate-400 text-lg">
            Ask a binary question. Seed it with shots. Let the group decide.
          </p>
        </header>

        <form 
          action={async (formData) => {
            setIsPending(true);
            try {
              await createMarketAction(formData);
            } catch (e) {
              alert(e instanceof Error ? e.message : 'Failed to create market');
              setIsPending(false);
            }
          }}
          className="space-y-8 bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl"
        >
          <div>
            <label className="block text-sm font-bold uppercase tracking-widest text-slate-500 mb-3">
              The Question
            </label>
            <input
              name="question"
              required
              placeholder="Will it rain tonight?"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-4 px-4 text-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-700"
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-widest text-slate-500 mb-3">
              Description (Optional)
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder="Provide context or resolution criteria..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-700"
            />
          </div>

          <button
            disabled={isPending}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black py-5 rounded-xl shadow-xl shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
          >
            {isPending ? 'CREATING...' : (
              <>
                <PlusCircle className="w-6 h-6" /> LAUNCH MARKET
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
