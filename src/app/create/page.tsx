'use client'

import React, { useState } from 'react';
import { createMarketAction } from '@/app/actions/market';
import { ArrowLeft, PlusCircle, X, ListPlus } from 'lucide-react';
import Link from 'next/link';

export default function CreateMarketPage() {
  const [isPending, setIsPending] = useState(false);
  const [outcomeType, setOutcomeType] = useState<'binary' | 'multiple'>('binary');
  const [options, setOptions] = useState<string[]>(['', '']);

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = [...options];
      newOptions.splice(index, 1);
      setOptions(newOptions);
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  return (
    <main className="min-h-screen bg-black text-white p-8 font-sans pb-32">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-12 uppercase text-[10px] font-black tracking-widest">
          <ArrowLeft className="w-4 h-4" /> Back to Markets
        </Link>

        <header className="mb-12">
          <div className="text-emerald-500 font-black tracking-tighter text-sm uppercase mb-3 italic">
            New Market
          </div>
          <h1 className="text-6xl font-black tracking-tighter leading-none mb-4 italic">
            CALL THE SHOT
          </h1>
          <p className="text-slate-400 text-lg font-medium">
            Ask a question. Define the stakes. Let the group decide.
          </p>
        </header>

        <form 
          action={async (formData) => {
            setIsPending(true);
            try {
              // Add multiple options to formData if applicable
              if (outcomeType === 'multiple') {
                formData.delete('answers'); // Clear any defaults
                options.forEach(opt => {
                  if (opt.trim()) formData.append('answers', opt);
                });
              }
              formData.append('outcomeType', outcomeType);
              await createMarketAction(formData);
            } catch (e) {
              alert(e instanceof Error ? e.message : 'Failed to create market');
              setIsPending(false);
            }
          }}
          className="space-y-8 bg-slate-900 border border-slate-800 p-10 rounded-[2.5rem] shadow-2xl"
        >
          {/* Market Type Toggle */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">
              Market Type
            </label>
            <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setOutcomeType('binary')}
                className={`flex-1 py-3 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${
                  outcomeType === 'binary' 
                    ? 'bg-emerald-500 text-black shadow-lg' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Binary (Yes/No)
              </button>
              <button
                type="button"
                onClick={() => setOutcomeType('multiple')}
                className={`flex-1 py-3 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${
                  outcomeType === 'multiple' 
                    ? 'bg-emerald-500 text-black shadow-lg' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Multiple Choice
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">
              The Question
            </label>
            <input
              name="question"
              required
              placeholder="Will David pass out first?"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-5 px-6 text-2xl font-black text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-800"
            />
          </div>

          {outcomeType === 'multiple' && (
            <div className="space-y-4">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                Options
              </label>
              <div className="space-y-3">
                {options.map((opt, i) => (
                  <div key={i} className="flex gap-3">
                    <input
                      required
                      placeholder={`Option ${i + 1}`}
                      value={opt}
                      onChange={(e) => updateOption(i, e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl py-4 px-5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-800"
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(i)}
                        className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                {options.length < 10 && (
                  <button
                    type="button"
                    onClick={addOption}
                    className="w-full flex items-center justify-center gap-2 py-4 border border-dashed border-slate-800 rounded-xl text-slate-600 hover:text-emerald-500 hover:border-emerald-500/50 transition-all text-[10px] font-black uppercase tracking-widest"
                  >
                    <ListPlus className="w-4 h-4" /> Add Option
                  </button>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">
              Description (Optional)
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder="Provide context or resolution criteria..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-800 resize-none font-medium"
            />
          </div>

          <div className="pt-4">
            <button
              disabled={isPending}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-6 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 text-xl italic uppercase tracking-tighter"
            >
              {isPending ? 'LAUNCHING...' : (
                <>
                  <PlusCircle className="w-7 h-7" /> Launch Market
                </>
              )}
            </button>
            <p className="mt-4 text-[10px] text-slate-600 text-center uppercase tracking-widest font-bold">
              Market liquidity is set to 50 shots automatically.
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
