import { useEffect, useReducer } from 'react';

import { createViewerSocket } from '../lib/socket';
import type {
  AuctionEndedDto,
  AuctionSnapshotDto,
  BidPlacedDto,
  TimerExtendedDto,
} from '../lib/types';
import { createMockLiveSocket } from '../mocks/liveSocket';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL as string | undefined;

export interface LiveState {
  phase: 'loading' | 'not_found' | 'ready';
  auction: AuctionSnapshotDto | null;
  ended: AuctionEndedDto | null;
  offsetMs: number;
  connected: boolean;
  extendedAt: number | null;
}

type Action =
  | { type: 'connection'; connected: boolean }
  | { type: 'snapshot'; auction: AuctionSnapshotDto }
  | { type: 'not_found' }
  | { type: 'bid'; payload: BidPlacedDto }
  | { type: 'extended'; payload: TimerExtendedDto }
  | { type: 'ended'; payload: AuctionEndedDto };

const initialState: LiveState = {
  phase: 'loading',
  auction: null,
  ended: null,
  offsetMs: 0,
  connected: false,
  extendedAt: null,
};

function endedFromSnapshot(auction: AuctionSnapshotDto): AuctionEndedDto | null {
  if (auction.status !== 'ENDED') return null;
  return {
    auctionId: auction.id,
    winnerId: auction.leaderId,
    finalPrice: auction.leaderId ? auction.currentPrice : null,
    reason: 'timer',
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
          endsAt: action.payload.endsAt,
          bids: [action.payload.bid, ...auction.bids],
        },
      };
    case 'extended':
      return { ...state, auction: { ...auction, endsAt: action.payload.endsAt }, extendedAt: Date.now() };
    case 'ended':
      return { ...state, auction: { ...auction, status: 'ENDED' }, ended: action.payload };
  }
}

export function useLiveAuction(auctionId: string): LiveState {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const socket = SOCKET_URL ? createViewerSocket(SOCKET_URL) : createMockLiveSocket();

    socket.on('connect', () => {
      dispatch({ type: 'connection', connected: true });
      socket.emit('auction:join', { auctionId, role: 'viewer' });
      socket.emit('auction:snapshot', { auctionId }, (res) => {
        dispatch(res.ok ? { type: 'snapshot', auction: res.auction } : { type: 'not_found' });
      });
    });
    socket.on('disconnect', () => dispatch({ type: 'connection', connected: false }));
    socket.on('auction:snapshot', (auction) => dispatch({ type: 'snapshot', auction }));
    socket.on('bid:placed', (payload) => dispatch({ type: 'bid', payload }));
    socket.on('timer:extended', (payload) => dispatch({ type: 'extended', payload }));
    socket.on('auction:ended', (payload) => dispatch({ type: 'ended', payload }));

    return () => {
      socket.disconnect();
    };
  }, [auctionId]);

  return state;
}
