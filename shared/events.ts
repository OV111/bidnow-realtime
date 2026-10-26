export type AuctionStatus = 'UPCOMING' | 'LIVE' | 'ENDED';

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
  viaBuyNow: boolean;
}

export interface AuctionSummary {
  id: string;
  title: string;
  photoUrl: string;
  currentPrice: number;
  buyNowPrice: number | null;
  status: AuctionStatus;
  startsAt: string | null;
  endsAt: string;
  bidCount: number;
}

export interface AuctionSnapshot {
  auctionId: string;
  title: string;
  description: string | null;
  photoUrl: string;
  sellerId: string;
  sellerName: string;
  currency: string;
  startPrice: number;
  buyNowPrice: number | null;
  minIncrement: number;
  currentPrice: number;
  leaderId: string | null;
  leaderName: string | null;
  status: AuctionStatus;
  startsAt: string | null;
  endsAt: string;
  winner: WinnerDto | null;
  bids: BidDto[];
  viewers: number;
}
