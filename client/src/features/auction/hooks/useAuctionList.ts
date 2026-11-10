import { useEffect, useState } from 'react';
import type { AuctionStatus, AuctionSummary } from '@shared/types';
import { listAuctions } from '../../../lib/api';

type Loaded = { key: string; auctions: AuctionSummary[] | null };

// Loads the auction list for one status filter. `retry` fetches it again after a failure.
export function useAuctionList(status?: AuctionStatus) {
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const key = `${status ?? 'all'}:${attempt}`;

  useEffect(() => {
    let cancelled = false;
    void listAuctions(status).then((result) => {
      if (!cancelled) setLoaded({ key, auctions: result.ok ? result.data : null });
    });
    return () => {
      cancelled = true;
    };
  }, [status, key]);

  // The stored result belongs to an older filter/attempt until the new request answers.
  const current = loaded && loaded.key === key ? loaded : null;
  const phase = current === null ? 'loading' : current.auctions === null ? 'error' : 'ready';

  return {
    phase,
    auctions: current?.auctions ?? [],
    retry: () => setAttempt((n) => n + 1),
  } as const;
}
