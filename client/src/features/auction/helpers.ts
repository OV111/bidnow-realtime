import type { AuctionSnapshot } from '@shared/types';
import type { BidOutcome } from '../../hooks/useLiveAuction';
import type { MessageKey } from '../../i18n';

export type Standing = 'winning' | 'outbid' | 'none';

export function nextMinBid(a: AuctionSnapshot): number {
  return a.leaderId ? a.currentPrice + a.minIncrement : a.startPrice;
}

export function getStanding(a: AuctionSnapshot, userId: string | null): Standing {
  if (!userId) return 'none';
  if (a.leaderId === userId) return 'winning';
  return a.bids.some((b) => b.userId === userId) ? 'outbid' : 'none';
}

type BidFailure = Extract<BidOutcome, { ok: false }>['error'];

export function bidErrorKey(error: BidFailure, status: AuctionSnapshot['status']): MessageKey {
  switch (error) {
    case 'too_low':
      return 'bid.error.BID_TOO_LOW';
    case 'not_live':
      return status === 'ENDED' ? 'bid.error.AUCTION_ENDED' : 'bid.error.AUCTION_NOT_LIVE';
    case 'unauthorized':
      return 'bid.error.NOT_AUTHENTICATED';
    case 'already_leading':
      return 'bid.error.ALREADY_LEADING';
    case 'own_auction':
      return 'bid.error.SELLER_CANNOT_BID';
    case 'rate_limited':
      return 'bid.error.RATE_LIMITED';
    case 'not_found':
      return 'bid.error.NOT_FOUND';
    case 'timeout':
      return 'bid.error.TIMEOUT';
    case 'offline':
      return 'bid.error.OFFLINE';
  }
}
