import { useEffect, useState } from 'react';
import type { AuctionStatus, AuctionSummary } from '@shared/types';
import { listAuctions } from '../../../lib/api';

type Loaded = { key: string; auctions: AuctionSummary[] | null };

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

  const current = loaded && loaded.key === key ? loaded : null;
  const phase = current === null ? 'loading' : current.auctions === null ? 'error' : 'ready';

  return {
    phase,
    auctions: current?.auctions ?? [],
    retry: () => setAttempt((n) => n + 1),
  } as const;
}
