import type { AuctionSnapshot } from '@shared/types';

export type Standing = 'winning' | 'outbid' | 'none';

export function nextMinBid(a: AuctionSnapshot): number {
  return a.leaderId ? a.currentPrice + a.minIncrement : a.startPrice;
}

export function getStanding(a: AuctionSnapshot, userId: string | null): Standing {
  if (!userId) return 'none';
  if (a.leaderId === userId) return 'winning';
  return a.bids.some((b) => b.userId === userId) ? 'outbid' : 'none';
}
