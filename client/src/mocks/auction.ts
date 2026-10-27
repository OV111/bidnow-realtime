import type { AuctionStateDto, BidDto } from '../lib/types';

export const CURRENT_USER_ID = 'u-selvi';

export const USER_NAMES: Record<string, string> = {
  'u-selvi': 'Selvi',
  'u-vahe': 'Vahe',
  'u-anna': 'Anna',
  'u-seller': 'Seller',
};

const AUCTION_ID = 'a-1';
const ago = (seconds: number) => new Date(Date.now() - seconds * 1000).toISOString();

const bids: BidDto[] = [
  { id: 'b-4', auctionId: AUCTION_ID, userId: 'u-vahe', amount: 14_000, createdAt: ago(20) },
  { id: 'b-3', auctionId: AUCTION_ID, userId: 'u-selvi', amount: 13_000, createdAt: ago(75) },
  { id: 'b-2', auctionId: AUCTION_ID, userId: 'u-anna', amount: 12_000, createdAt: ago(160) },
  { id: 'b-1', auctionId: AUCTION_ID, userId: 'u-vahe', amount: 11_000, createdAt: ago(300) },
];

export function createMockAuction(): AuctionStateDto {
  return {
    id: AUCTION_ID,
    title: 'Vintage Polaroid SX-70 camera',
    photoUrl: '',
    sellerId: 'u-seller',
    status: 'LIVE',
    startPrice: 10_000,
    currentPrice: 14_000,
    minIncrement: 1_000,
    buyNowPrice: 30_000,
    leaderId: 'u-vahe',
    endsAt: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
    bids,
  };
}
