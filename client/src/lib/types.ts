export type AuctionStatus = 'SCHEDULED' | 'LIVE' | 'ENDED';
export type EndReason = 'timer' | 'buy_now';

export interface BidDto {
  id: string;
  auctionId: string;
  userId: string;
  amount: number;
  createdAt: string;
}

export interface AuctionStateDto {
  id: string;
  title: string;
  photoUrl: string;
  sellerId: string;
  status: AuctionStatus;
  startPrice: number;
  currentPrice: number;
  minIncrement: number;
  buyNowPrice: number | null;
  leaderId: string | null;
  endsAt: string;
  bids: BidDto[];
}

export interface AuctionEndedDto {
  auctionId: string;
  winnerId: string | null;
  finalPrice: number | null;
  reason: EndReason;
}
