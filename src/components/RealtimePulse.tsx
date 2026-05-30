'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface RealtimePulseProps {
  marketId?: string;
}

/**
 * A headless component that listens for database changes
 * and refreshes the current page automatically.
 */
export function RealtimePulse({ marketId }: RealtimePulseProps) {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    console.log('Pulse: Initializing Realtime...');

    // 1. Listen for new bets on this market
    const betChannel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bets',
          filter: marketId ? `market_id=eq.${marketId}` : undefined
        },
        (payload) => {
          console.log('Pulse: New bet detected!', payload);
          router.refresh();
        }
      )
      .subscribe();

    // 2. Listen for market resolution/updates
    const marketChannel = supabase
      .channel('market-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'markets',
          filter: marketId ? `id=eq.${marketId}` : undefined
        },
        (payload) => {
          console.log('Pulse: Market update detected!', payload);
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(betChannel);
      supabase.removeChannel(marketChannel);
    };
  }, [supabase, router, marketId]);

  return null; // Headless
}
