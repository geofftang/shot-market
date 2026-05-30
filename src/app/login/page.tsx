'use client'

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ArrowLeft, Beer, Mail, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  
  const supabase = createClient();

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const cleanEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('Supabase Auth Error:', error);
      let errorText = error.message;
      if (errorText.includes('Unsupported provider') || error.status === 400) {
        errorText = "Login failed. Please ensure 'Email' provider and 'Confirm Email' are enabled in your Supabase Dashboard.";
      }
      setMessage({ text: errorText, type: 'error' });
    } else {
      setMessage({ text: "Magic link sent! Check your inbox.", type: 'success' });
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 font-sans">
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-12 uppercase text-[10px] font-black tracking-widest">
          <ArrowLeft className="w-4 h-4" /> Back to Markets
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="bg-emerald-500 p-2 rounded-xl">
            <Beer className="w-6 h-6 text-black" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic">Shot Caller</h1>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-10 rounded-[2rem] shadow-2xl">
          <header className="mb-10">
            <h2 className="text-2xl font-black tracking-tight mb-2">Passwordless Login</h2>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              We&apos;ll send a magic link to your inbox. No passwords required.
            </p>
          </header>

          <form onSubmit={handleMagicLink} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Your Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-800"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {message && (
              <div className={`flex gap-3 p-4 rounded-xl text-sm font-bold ${
                message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {message.type === 'success' ? <Sparkles className="w-5 h-5 shrink-0" /> : null}
                {message.text}
              </div>
            )}

          <button
              disabled={loading}
              className="w-full bg-white hover:bg-emerald-500 hover:text-black text-black font-black py-4 rounded-xl shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  SEND MAGIC LINK
                  <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/5 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-700">
              Secured by Supabase
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
