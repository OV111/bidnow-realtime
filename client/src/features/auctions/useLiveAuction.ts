import { useEffect, useRef, useState } from 'react';

import type { BidError, BuyNowError } from '@shared/events';
import type { AuctionSnapshot, BidDto, Result, WinnerDto } from '@shared/types';

import { SOCKET_URL } from '@/lib/config';
import { createSocket, type LiveSocket } from '@/lib/socket';
import { clearToken } from '@/lib/token';

export type BidFailure = BidError | 'timeout' | 'offline';
export type BuyNowFailure = BuyNowError | 'timeout' | 'offline';
export type BidOutcome = Result<BidDto, BidFailure>;
export type BuyNowOutcome = Result<WinnerDto, BuyNowFailure>;

interface LiveState {
  phase: 'loading' | 'not_found' | 'error' | 'ready';
  auction: AuctionSnapshot | null;
  clockOffsetMs: number;
  connected: boolean;
  extendedAt: number | null;
  sessionExpired: boolean;
}

const initialState: LiveState = {
  phase: 'loading',
  auction: null,
  clockOffsetMs: 0,
  connected: false,
  extendedAt: null,
  sessionExpired: false,
};

async function connectSocket(token: string | null) {
  if (SOCKET_URL) return createSocket(SOCKET_URL, token);
  if (!import.meta.env.DEV) throw new Error('VITE_SOCKET_URL is required in production');

  const { createMockSocket } = await import('@/mock/mockSocket');
  return createMockSocket(token);
}

function useLiveAuction(auctionId: string, token: string | null = null) {
  const [state, setState] = useState(initialState);
  const socketRef = useRef<LiveSocket | null>(null);

  useEffect(() => {
    let cancelled = false;

    function updateAuction(eventAuctionId: string, changes: Partial<AuctionSnapshot>, extra: Partial<LiveState> = {}) {
      setState((current) => {
        if (current.auction?.id !== eventAuctionId) return current;
        return { ...current, ...extra, auction: { ...current.auction, ...changes } };
      });
    }

    function listen(socket: LiveSocket) {
      socket.on('connect', () => {
        setState((current) => ({ ...current, connected: true }));

        socket.emit('auction:join', { auctionId }, (result) => {
          if (!result.ok) {
            const phase = result.error === 'not_found' ? 'not_found' : 'error';
            setState((current) => ({ ...current, phase }));
            return;
          }

          setState((current) => ({
            ...current,
            phase: 'ready',
            auction: result.data,
            clockOffsetMs: new Date(result.data.serverTime).getTime() - Date.now(),
          }));
        });
      });

      socket.on('connect_error', (error) => {
        if (error.message === 'unauthorized') clearToken();
        setState((current) => ({
          ...current,
          connected: false,
          phase: current.phase === 'ready' ? 'ready' : 'error',
        }));
      });

      socket.on('disconnect', () => {
        setState((current) => ({ ...current, connected: false }));
      });

      socket.on('auth:expired', () => {
        setState((current) => ({ ...current, sessionExpired: true }));
      });

      socket.on('bid:placed', (event) => {
        setState((current) => {
          const auction = current.auction;
          if (auction?.id !== event.auctionId) return current;
          if (auction.bids.some((bid) => bid.id === event.bid.id)) return current;

          return {
            ...current,
            auction: {
              ...auction,
              currentPrice: event.currentPrice,
              leaderId: event.leaderId,
              leaderName: event.leaderName,
              endsAt: event.endsAt,
              bids: [event.bid, ...auction.bids],
            },
          };
        });
      });

      socket.on('timer:extended', (event) => {
        updateAuction(event.auctionId, { endsAt: event.endsAt }, { extendedAt: Date.now() });
      });

      socket.on('auction:started', (event) => {
        updateAuction(event.auctionId, { status: 'LIVE' });
      });

      socket.on('auction:ended', (event) => {
        updateAuction(event.auctionId, { status: 'ENDED', winner: event.winner });
      });

      socket.on('viewers:update', (event) => {
        updateAuction(event.auctionId, { viewers: event.count });
      });
    }

    connectSocket(token)
      .then((socket) => {
        if (cancelled) {
          socket.disconnect();
          return;
        }
        socketRef.current = socket;
        listen(socket);
      })
      .catch((error) => {
        console.error('live socket setup failed', error);
        if (!cancelled) setState((current) => ({ ...current, phase: 'error' }));
      });

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
      setState(initialState);
    };
  }, [auctionId, token]);

  async function placeBid(amount: number): Promise<BidOutcome> {
    const socket = socketRef.current;
    if (!socket?.connected) return { ok: false, error: 'offline' };

    try {
      return await socket.timeout(5000).emitWithAck('bid:place', { auctionId, amount });
    } catch {
      return { ok: false, error: 'timeout' };
    }
  }

  async function buyNow(): Promise<BuyNowOutcome> {
    const socket = socketRef.current;
    if (!socket?.connected) return { ok: false, error: 'offline' };

    try {
      return await socket.timeout(5000).emitWithAck('auction:buyNow', { auctionId });
    } catch {
      return { ok: false, error: 'timeout' };
    }
  }

  return { ...state, placeBid, buyNow };
}

export default useLiveAuction;
