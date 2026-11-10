export type AuctionStatus = 'SCHEDULED' | 'LIVE' | 'ENDED';
export type EndReason = 'timer' | 'buy_now';

export interface UserDto {
  id: string;
  name: string;
}

export interface BidDto {
  id: string;
  auctionId: string;
  userId: string;
  userName: string;
  amount: number;
  createdAt: string;
}

export interface WinnerDto {
  userId: string;
  userName: string;
  finalPrice: number;
  reason: EndReason;
}

export interface AuctionSummary {
  id: string;
  title: string;
  photoUrl: string;
  currency: string;
  currentPrice: number;
  buyNowPrice: number | null;
  status: AuctionStatus;
  startsAt: string | null;
  endsAt: string;
  bidCount: number;
}

//reply to auction:join.
export interface AuctionSnapshot {
  id: string;
  title: string;
  description: string | null;
  photoUrl: string;
  sellerId: string;
  sellerName: string;
  currency: string;

  startPrice: number;
  minIncrement: number;
  buyNowPrice: number | null;

  currentPrice: number;
  leaderId: string | null;
  leaderName: string | null;

  status: AuctionStatus;
  startsAt: string | null;
  endsAt: string;
  winner: WinnerDto | null; 

  bids: BidDto[]; 
  viewers: number;
  serverTime: string;
}

// Reply shape for every socket request (join, bid, buy now).
export type Result<T, E extends string> =
  | { ok: true; data: T }
  | { ok: false; error: E };
