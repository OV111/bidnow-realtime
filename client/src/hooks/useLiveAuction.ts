import { useCallback, useEffect, useReducer, useRef } from 'react';

import type {
  AuctionEndedEvent,
  AuctionStartedEvent,
  BidError,
  BidPlacedEvent,
  TimerExtendedEvent,
  ViewersEvent,
} from '@shared/events';
import type { AuctionSnapshot, BidDto, Result } from '@shared/types';
import { createSocket, type LiveSocket } from '../lib/socket';
import { createMockLiveSocket } from '../mock/liveSocket';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL as string | undefined;

export interface LiveState {
  phase: 'loading' | 'not_found' | 'ready';
  auction: AuctionSnapshot | null;
  ended: AuctionEndedEvent | null;
  offsetMs: number;
  connected: boolean;
  extendedAt: number | null;
}

export type BidOutcome = Result<BidDto, BidError | 'timeout' | 'offline'>;

export interface LiveAuction extends LiveState {
  placeBid: (amount: number) => Promise<BidOutcome>;
}

type Action =
  | { type: 'connection'; connected: boolean }
  | { type: 'snapshot'; auction: AuctionSnapshot }
  | { type: 'not_found' }
  | { type: 'bid'; payload: BidPlacedEvent }
  | { type: 'extended'; payload: TimerExtendedEvent }
  | { type: 'started'; payload: AuctionStartedEvent }
  | { type: 'ended'; payload: AuctionEndedEvent }
  | { type: 'viewers'; payload: ViewersEvent };

const initialState: LiveState = {
  phase: 'loading',
  auction: null,
  ended: null,
  offsetMs: 0,
  connected: false,
  extendedAt: null,
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

function reducer(state: LiveState, action: Action): LiveState {
  switch (action.type) {
    case 'connection':
      return { ...state, connected: action.connected };
    case 'not_found':
      return { ...state, phase: 'not_found' };
    case 'snapshot':
      return {
        ...state,
        phase: 'ready',
        auction: action.auction,
        ended: endedFromSnapshot(action.auction),
        offsetMs: new Date(action.auction.serverTime).getTime() - Date.now(),
      };
  }

  const { auction } = state;
  if (!auction || action.payload.auctionId !== auction.id) return state;

  switch (action.type) {
    case 'bid':
      if (auction.bids.some((b) => b.id === action.payload.bid.id)) return state;
      return {
        ...state,
        auction: {
          ...auction,
          currentPrice: action.payload.currentPrice,
          leaderId: action.payload.leaderId,
          leaderName: action.payload.leaderName,
          endsAt: action.payload.endsAt,
          bids: [action.payload.bid, ...auction.bids],
        },
      };
    case 'extended':
      return { ...state, auction: { ...auction, endsAt: action.payload.endsAt }, extendedAt: Date.now() };
    case 'started':
      return { ...state, auction: { ...auction, status: 'LIVE' } };
    case 'ended':
      return { ...state, auction: { ...auction, status: 'ENDED', winner: action.payload.winner }, ended: action.payload };
    case 'viewers':
      return { ...state, auction: { ...auction, viewers: action.payload.count } };
  }
}

export function useLiveAuction(auctionId: string, token: string | null = null): LiveAuction {
  const [state, dispatch] = useReducer(reducer, initialState);
  const socketRef = useRef<LiveSocket | null>(null);

  useEffect(() => {
    const socket = SOCKET_URL ? createSocket(SOCKET_URL, token) : createMockLiveSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      dispatch({ type: 'connection', connected: true });
      socket.emit('auction:join', { auctionId }, (res) => {
        dispatch(res.ok ? { type: 'snapshot', auction: res.data } : { type: 'not_found' });
      });
    });
    socket.on('disconnect', () => dispatch({ type: 'connection', connected: false }));
    socket.on('bid:placed', (payload) => dispatch({ type: 'bid', payload }));
    socket.on('timer:extended', (payload) => dispatch({ type: 'extended', payload }));
    socket.on('auction:started', (payload) => dispatch({ type: 'started', payload }));
    socket.on('auction:ended', (payload) => dispatch({ type: 'ended', payload }));
    socket.on('viewers:update', (payload) => dispatch({ type: 'viewers', payload }));

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

  return { ...state, placeBid };
}
