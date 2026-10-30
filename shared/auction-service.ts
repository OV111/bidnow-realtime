import type {
  AuctionEndedEvent,
  AuctionStartedEvent,
  BidError,
  BidPlacedEvent,
  BuyNowError,
  TimerExtendedEvent,
} from './events';
import type { AuctionSnapshot, Result } from './types';

export type AuctionState = Omit<AuctionSnapshot, 'viewers' | 'serverTime'>;
export type PlaceBidError = Exclude<BidError, 'unauthorized' | 'rate_limited'>;
export type BuyNowServiceError = Exclude<BuyNowError, 'unauthorized'>;

export interface PlaceBidInput {
  auctionId: string;
  userId: string;
  userName: string;
  amount: number;
  receivedAt: string; 
}

export interface PlaceBidOutput {
  placed: BidPlacedEvent;
  extended: TimerExtendedEvent | null;
}

export interface BuyNowInput {
  auctionId: string;
  userId: string;
  userName: string;
  receivedAt: string;
}

export type AuctionServiceEvent =
  | { type: 'auction:started'; payload: AuctionStartedEvent }
  | { type: 'auction:ended'; payload: AuctionEndedEvent };

export interface AuctionService {
  getState(auctionId: string): Promise<AuctionState | null>;
  placeBid(input: PlaceBidInput): Promise<Result<PlaceBidOutput, PlaceBidError>>;
  buyNow(input: BuyNowInput): Promise<Result<AuctionEndedEvent, BuyNowServiceError>>;
  subscribe(handler: (event: AuctionServiceEvent) => void): () => void;
}
