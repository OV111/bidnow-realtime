import type { AuctionSnapshot, AuctionSummary, BidDto } from '@shared/events';

export const currentUser = { id: 'me', name: 'You' };

const names: Record<string, string> = {
  me: 'You',
  'seller-1': 'Anna Petrosyan',
  'seller-2': 'Retro Finds',
  aram: 'Aram',
  lilit: 'Lilit',
  davit: 'Davit',
};

const minutes = (n: number) => n * 60_000;
const at = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString();

function bids(auctionId: string, list: [string, number][]): BidDto[] {
  return list
    .map(([userId, amount], i) => ({
      id: `${auctionId}-${i}`,
      auctionId,
      userId,
      userName: names[userId],
      amount,
      createdAt: at(-minutes(list.length - i)),
    }))
    .reverse();
}

const base = {
  photoUrl: '',
  currency: 'USD',
  startsAt: null,
  winner: null,
  viewers: 0,
};

export const auctions: AuctionSnapshot[] = [
  {
    ...base,
    auctionId: 'vintage-camera',
    title: 'Vintage Leica M3 Camera',
    description: '1950s rangefinder in excellent condition. Shutter tested, lens is clean with no haze.',
    sellerId: 'seller-1',
    sellerName: names['seller-1'],
    startPrice: 50_000,
    buyNowPrice: 150_000,
    minIncrement: 2_500,
    currentPrice: 57_500,
    leaderId: 'lilit',
    leaderName: 'Lilit',
    status: 'LIVE',
    endsAt: at(minutes(3)),
    viewers: 12,
    bids: bids('vintage-camera', [
      ['aram', 52_500],
      ['me', 55_000],
      ['lilit', 57_500],
    ]),
  },
  {
    ...base,
    auctionId: 'mechanical-watch',
    title: 'Swiss Mechanical Watch',
    description: 'Automatic movement, sapphire crystal, original box and papers.',
    sellerId: 'seller-2',
    sellerName: names['seller-2'],
    startPrice: 20_000,
    buyNowPrice: 60_000,
    minIncrement: 1_000,
    currentPrice: 20_000,
    leaderId: null,
    leaderName: null,
    status: 'LIVE',
    endsAt: at(minutes(15)),
    viewers: 3,
    bids: [],
  },
  {
    ...base,
    auctionId: 'vinyl-collection',
    title: 'Jazz Vinyl Collection (40 records)',
    description: 'Blue Note and Prestige pressings from the 60s. All sleeves included.',
    sellerId: 'seller-1',
    sellerName: names['seller-1'],
    startPrice: 15_000,
    buyNowPrice: null,
    minIncrement: 500,
    currentPrice: 18_500,
    leaderId: 'me',
    leaderName: 'You',
    status: 'LIVE',
    endsAt: at(minutes(45)),
    viewers: 7,
    bids: bids('vinyl-collection', [
      ['davit', 16_000],
      ['lilit', 17_500],
      ['me', 18_500],
    ]),
  },
  {
    ...base,
    auctionId: 'road-bike',
    title: 'Carbon Road Bike',
    description: 'Size 56, Shimano 105 groupset, recently serviced.',
    sellerId: 'seller-2',
    sellerName: names['seller-2'],
    startPrice: 80_000,
    buyNowPrice: 140_000,
    minIncrement: 5_000,
    currentPrice: 80_000,
    leaderId: null,
    leaderName: null,
    status: 'UPCOMING',
    startsAt: at(minutes(30)),
    endsAt: at(minutes(60)),
    bids: [],
  },
  {
    ...base,
    auctionId: 'oil-painting',
    title: 'Original Oil Painting – Ararat at Dawn',
    description: '60×80 cm, signed by the artist, framed.',
    sellerId: 'seller-1',
    sellerName: names['seller-1'],
    startPrice: 30_000,
    buyNowPrice: null,
    minIncrement: 2_000,
    currentPrice: 30_000,
    leaderId: null,
    leaderName: null,
    status: 'UPCOMING',
    startsAt: at(minutes(180)),
    endsAt: at(minutes(240)),
    bids: [],
  },
  {
    ...base,
    auctionId: 'gaming-console',
    title: 'Retro Gaming Console Bundle',
    description: 'Console, two controllers and 12 cartridges.',
    sellerId: 'seller-2',
    sellerName: names['seller-2'],
    startPrice: 10_000,
    buyNowPrice: 25_000,
    minIncrement: 500,
    currentPrice: 16_500,
    leaderId: 'davit',
    leaderName: 'Davit',
    status: 'ENDED',
    endsAt: at(-minutes(30)),
    winner: { userId: 'davit', userName: 'Davit', finalPrice: 16_500, viaBuyNow: false },
    bids: bids('gaming-console', [
      ['aram', 12_000],
      ['lilit', 14_000],
      ['davit', 16_500],
    ]),
  },
  {
    ...base,
    auctionId: 'typewriter',
    title: 'Restored 1960s Typewriter',
    description: 'Fully serviced, new ribbon, comes with the original case.',
    sellerId: 'seller-1',
    sellerName: names['seller-1'],
    startPrice: 8_000,
    buyNowPrice: 30_000,
    minIncrement: 500,
    currentPrice: 30_000,
    leaderId: 'me',
    leaderName: 'You',
    status: 'ENDED',
    endsAt: at(-minutes(120)),
    winner: { userId: 'me', userName: 'You', finalPrice: 30_000, viaBuyNow: true },
    bids: bids('typewriter', [['aram', 9_000]]),
  },
];

export const summaries: AuctionSummary[] = auctions.map((a) => ({
  id: a.auctionId,
  title: a.title,
  photoUrl: a.photoUrl,
  currentPrice: a.currentPrice,
  buyNowPrice: a.buyNowPrice,
  status: a.status,
  startsAt: a.startsAt,
  endsAt: a.endsAt,
  bidCount: a.bids.length,
}));

export function getAuction(id: string | undefined): AuctionSnapshot | undefined {
  return auctions.find((a) => a.auctionId === id);
}
