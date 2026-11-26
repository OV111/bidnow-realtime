import { useEffect, useState } from 'react';

import type { AuctionStatus, AuctionSummary } from '@shared/types';

import { listAuctions } from '@/features/auctions/api';

function useAuctionList(status?: AuctionStatus) {
  const [phase, setPhase] = useState<'loading' | 'error' | 'ready'>('loading');
  const [auctions, setAuctions] = useState<AuctionSummary[]>([]);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    listAuctions(status).then((result) => {
      if (cancelled) return;

      if (result.ok) {
        setAuctions(result.data);
        setPhase('ready');
      } else {
        setPhase('error');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [status, attempt]);

  function retry() {
    setPhase('loading');
    setAttempt((count) => count + 1);
  }

  return { phase, auctions, retry };
}

export default useAuctionList;
