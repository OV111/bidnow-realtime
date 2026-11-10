import type { AuctionService, AuctionState } from '@shared/auction-service';
import type { BidDto } from '@shared/types';

const MIN = 60_000;
const iso = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString();

function bid(auctionId: string, n: number, userId: string, userName: string, amount: number, minutesAgo: number): BidDto {
  return { id: `${auctionId}-b${n}`, auctionId, userId, userName, amount, createdAt: iso(-minutesAgo * MIN) };
}
const base = {
  description: null,
  photoUrl: '',
  sellerId: 'u-seller',
  sellerName: 'Seller',
  currency: 'USD',
  startsAt: null,
  winner: null,
};

function seed(): AuctionState[] {
  return [
    {
      ...base,
      id: 'a-1',
      title: 'Vintage Polaroid SX-70 camera',
      startPrice: 10_000,
      minIncrement: 1_000,
      buyNowPrice: 30_000,
      currentPrice: 13_000,
      leaderId: 'u-selvi',
      leaderName: 'Selvi',
      status: 'LIVE',
      endsAt: iso(30 * MIN),
      bids: [
        bid('a-1', 3, 'u-selvi', 'Selvi', 13_000, 2),
        bid('a-1', 2, 'u-anna', 'Anna', 12_000, 5),
        bid('a-1', 1, 'u-vahe', 'Vahe', 11_000, 9),
      ],
    },
    {
      ...base,
      id: 'a-2',
      title: 'Swiss mechanical watch',
      startPrice: 20_000,
      minIncrement: 1_000,
      buyNowPrice: 60_000,
      currentPrice: 20_000,
      leaderId: null,
      leaderName: null,
      status: 'SCHEDULED',
      startsAt: iso(10 * MIN),
      endsAt: iso(40 * MIN),
      bids: [],
    },
    {
      ...base,
      id: 'a-3',
      title: 'Retro gaming console',
      startPrice: 10_000,
      minIncrement: 500,
      buyNowPrice: null,
      currentPrice: 16_500,
      leaderId: 'u-anna',
      leaderName: 'Anna',
      status: 'ENDED',
      endsAt: iso(-30 * MIN),
      winner: { userId: 'u-anna', userName: 'Anna', finalPrice: 16_500, reason: 'timer' },
      bids: [bid('a-3', 1, 'u-anna', 'Anna', 16_500, 35)],
    },
  ];
}

export class MockAuctionService implements AuctionService {
  private auctions = new Map(seed().map((a) => [a.id, a] as const));

  async getState(auctionId: string) {
    return this.auctions.get(auctionId) ?? null;
  }

  async placeBid(): Promise<never> {
    throw new Error('placeBid: not implemented until Day 3');
  }

  async buyNow(): Promise<never> {
    throw new Error('buyNow: not implemented until Day 6');
  }

  subscribe() {
    return () => {};
  }
}