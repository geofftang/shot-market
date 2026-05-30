'use client'

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

interface NavBarProps {
  initialUser: User | null;
  initialUsername: string | null;
}

export function NavBar({ initialUser, initialUsername }: NavBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  
  const [user, setUser] = useState<User | null>(initialUser);
  const [username, setUsername] = useState<string | null>(initialUsername);

  useEffect(() => {
    // We still listen for real-time changes (logouts, handle changes)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', currentUser.id)
            .single();
          if (profile?.username) setUsername(profile.username);
        } else {
          setUsername(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogin = () => {
    router.push('/login');
  };

  const displayName = username || user?.email?.split('@')[0];

  return (
    <nav className="bg-black z-50 border-b border-white/5">
      <div className="max-w-6xl mx-auto px-8 h-20 flex items-center">
        {/* Left: Brand */}
        <div className="flex-1">
          <Link href="/" className="group inline-block">
            <span className="font-black text-xl tracking-tighter uppercase italic text-slate-200 group-hover:text-emerald-500 transition-colors">
              Shot Caller
            </span>
          </Link>
        </div>

        {/* Center: Main Nav */}
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
            Leaderboard
          </Link>
        </div>

        {/* Right: Auth Actions - Now instant because of server-side data */}
        <div className="flex-1 flex justify-end">
          <div className="min-w-[120px] flex justify-end">
            {user ? (
              <div className="flex items-center gap-8">
                <Link 
                  href="/create" 
                  className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 hover:text-emerald-500 transition-all"
                >
                  Create Market
                </Link>
                <Link href={`/profile/${username || user?.email?.split('@')[0]}`} className="flex items-center group/badge">
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-500 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all group-hover/badge:bg-emerald-500/20 group-hover/badge:border-emerald-500/40">
                    @{displayName}
                  </span>
                </Link>
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
      </div>
    </nav>
  );
}
