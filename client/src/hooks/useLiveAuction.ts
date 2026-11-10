import { useCallback, useEffect, useRef, useState } from 'react';

import type { AuctionEndedEvent, BidError, BuyNowError } from '@shared/events';
import type { AuctionSnapshot, BidDto, Result, WinnerDto } from '@shared/types';
import { clearToken } from '../lib/auth';
import { createSocket, type LiveSocket } from '../lib/socket';
import { createMockLiveSocket } from '../mock/liveSocket';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL as string | undefined;

export interface LiveState {
  phase: 'loading' | 'not_found' | 'error' | 'ready';
  auction: AuctionSnapshot | null;
  ended: AuctionEndedEvent | null;
  offsetMs: number;
  connected: boolean;
  extendedAt: number | null;
  sessionExpired: boolean;
}

export type BidOutcome = Result<BidDto, BidError | 'timeout' | 'offline'>;
export type BuyNowOutcome = Result<WinnerDto, BuyNowError | 'timeout' | 'offline'>;

export interface LiveAuction extends LiveState {
  placeBid: (amount: number) => Promise<BidOutcome>;
  buyNow: () => Promise<BuyNowOutcome>;
}

const initialState: LiveState = {
  phase: 'loading',
  auction: null,
  ended: null,
  offsetMs: 0,
  connected: false,
  extendedAt: null,
  sessionExpired: false,
};

function endedFromSnapshot(auction: AuctionSnapshot): AuctionEndedEvent | null {
  if (auction.status !== 'ENDED') return null;
  return {
    auctionId: auction.id,
    reason: auction.winner?.reason ?? 'timer',
    sold: auction.winner !== null,
    winner: auction.winner,
  };
}

export function useLiveAuction(auctionId: string, token: string | null = null): LiveAuction {
  const [state, setState] = useState<LiveState>(initialState);
  const socketRef = useRef<LiveSocket | null>(null);

  useEffect(() => {
    const socket = SOCKET_URL ? createSocket(SOCKET_URL, token) : createMockLiveSocket();
    socketRef.current = socket;

    // Apply an update only if the event belongs to the auction we are showing.
    const patch = (eventAuctionId: string, update: (s: LiveState, a: AuctionSnapshot) => LiveState) =>
      setState((s) => (s.auction && s.auction.id === eventAuctionId ? update(s, s.auction) : s));

    socket.on('connect', () => {
      setState((s) => ({ ...s, connected: true }));
      socket.emit('auction:join', { auctionId }, (res) => {
        // Only a real not_found means "no such auction"; rate_limited / server_error are transient.
        if (!res.ok) return setState((s) => ({ ...s, phase: res.error === 'not_found' ? 'not_found' : 'error' }));
        const offsetMs = new Date(res.data.serverTime).getTime() - Date.now();
        setState((s) => ({
          ...s,
          phase: 'ready',
          auction: res.data,
          ended: endedFromSnapshot(res.data),
          offsetMs,
        }));
      });
    });
    // The server rejects the handshake ('unauthorized' for a bad/stale token, 'rate_limited' for the IP
    // limit). Socket.IO does not retry these, so without this the page would spin forever.
    socket.on('connect_error', (err) => {
      if (err.message === 'unauthorized') clearToken();
      setState((s) => ({ ...s, connected: false, phase: s.phase === 'ready' ? s.phase : 'error' }));
    });
    socket.on('disconnect', () => setState((s) => ({ ...s, connected: false })));
    socket.on('auth:expired', () => setState((s) => ({ ...s, sessionExpired: true })));

    socket.on('bid:placed', (p) =>
      patch(p.auctionId, (s, a) => {
        if (a.bids.some((b) => b.id === p.bid.id)) return s;
        return {
          ...s,
          auction: {
            ...a,
            currentPrice: p.currentPrice,
            leaderId: p.leaderId,
            leaderName: p.leaderName,
            endsAt: p.endsAt,
            bids: [p.bid, ...a.bids],
          },
        };
      }),
    );
    socket.on('timer:extended', (p) =>
      patch(p.auctionId, (s, a) => ({ ...s, auction: { ...a, endsAt: p.endsAt }, extendedAt: Date.now() })),
    );
    socket.on('auction:started', (p) =>
      patch(p.auctionId, (s, a) => ({ ...s, auction: { ...a, status: 'LIVE' } })),
    );
    socket.on('auction:ended', (p) =>
      patch(p.auctionId, (s, a) => ({ ...s, auction: { ...a, status: 'ENDED', winner: p.winner }, ended: p })),
    );
    socket.on('viewers:update', (p) =>
      patch(p.auctionId, (s, a) => ({ ...s, auction: { ...a, viewers: p.count } })),
    );

    return () => {
      socketRef.current = null;
      socket.disconnect();
    };
  }, [auctionId, token]);

  const placeBid = useCallback(
    (amount: number) =>
      new Promise<BidOutcome>((resolve) => {
        const socket = socketRef.current;
        if (!socket?.connected) return resolve({ ok: false, error: 'offline' });
        socket.timeout(5000).emit('bid:place', { auctionId, amount }, (err, res) => {
          resolve(err ? { ok: false, error: 'timeout' } : res);
        });
      }),
    [auctionId],
  );

  const buyNow = useCallback(
    () =>
      new Promise<BuyNowOutcome>((resolve) => {
        const socket = socketRef.current;
        if (!socket?.connected) return resolve({ ok: false, error: 'offline' });
        socket.timeout(5000).emit('auction:buyNow', { auctionId }, (err, res) => {
          resolve(err ? { ok: false, error: 'timeout' } : res);
        });
      }),
    [auctionId],
  );

  return { ...state, placeBid, buyNow };
}
