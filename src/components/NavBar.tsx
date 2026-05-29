'use client'

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

export function NavBar() {
  const pathname = usePathname();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleLogin = () => {
    router.push('/login');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="bg-black z-50">
      <div className="max-w-6xl mx-auto px-8 h-20 flex items-center justify-between">
        <Link href="/" className="group">
          <span className="font-black text-xl tracking-tighter uppercase italic text-slate-200 group-hover:text-emerald-500 transition-colors">
            Shot Market
          </span>
        </Link>

        <div className="flex items-center gap-10">
          <Link
            href="/"
            className={`text-[10px] font-black uppercase tracking-[0.25em] transition-all ${
              pathname === '/' ? 'text-emerald-500' : 'text-slate-600 hover:text-slate-300'
            }`}
          >
            Markets
          </Link>
          <Link
            href="/leaderboard"
            className={`text-[10px] font-black uppercase tracking-[0.25em] transition-all ${
              pathname === '/leaderboard' ? 'text-emerald-500' : 'text-slate-600 hover:text-slate-300'
            }`}
          >
            Board
          </Link>

          {user ? (
            <div className="flex items-center gap-6">
              <Link 
                href="/create" 
                className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 hover:text-emerald-500 transition-all"
              >
                + Create
              </Link>
              <button
                onClick={handleLogout}
                className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-600 hover:text-rose-500 transition-all"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-500 hover:text-emerald-400 transition-all"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
