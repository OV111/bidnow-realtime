// Everything that can happen in a live auction.

import type {
  AuctionSnapshot,
  BidDto,
  EndReason,
  Result,
  UserDto,
  WinnerDto,
} from './types';

export type JoinError = 'not_found' | 'rate_limited';

export type BidError =
  | 'unauthorized'
  | 'not_found'
  | 'not_live'
  | 'too_low'
  | 'own_auction'
  | 'already_leading'
  | 'rate_limited';

export type BuyNowError =
  | 'unauthorized'
  | 'not_found'
  | 'not_live'
  | 'own_auction'
  | 'no_buy_now';

// Server → room broadcasts.
export interface BidPlacedEvent {
  auctionId: string;
  bid: BidDto;
  currentPrice: number;
  leaderId: string;
  leaderName: string;
  endsAt: string;
}

export interface TimerExtendedEvent {
  auctionId: string;
  endsAt: string;
}

export interface AuctionStartedEvent {
  auctionId: string;
}

export interface AuctionEndedEvent {
  auctionId: string;
  reason: EndReason;
  sold: boolean;
  winner: WinnerDto | null;
}

export interface ViewersEvent {
  auctionId: string;
  count: number;
}

export interface ServerToClientEvents {
  'bid:placed': (e: BidPlacedEvent) => void;
  'timer:extended': (e: TimerExtendedEvent) => void;
  'auction:started': (e: AuctionStartedEvent) => void;
  'auction:ended': (e: AuctionEndedEvent) => void;
  'viewers:update': (e: ViewersEvent) => void;
}

export interface ClientToServerEvents {
  'auction:join': (
    p: { auctionId: string },
    ack: (r: Result<AuctionSnapshot, JoinError>) => void,
  ) => void;
  'auction:leave': (p: { auctionId: string }) => void;
  'bid:place': (
    p: { auctionId: string; amount: number },
    ack: (r: Result<BidDto, BidError>) => void,
  ) => void;
  'auction:buyNow': (
    p: { auctionId: string },
    ack: (r: Result<WinnerDto, BuyNowError>) => void,
  ) => void;
}

export interface SocketData {
  user: UserDto | null;
}

export const auctionRoom = (auctionId: string) => `auction:${auctionId}`;