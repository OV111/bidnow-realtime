import { prisma } from '../src/db';

const MIN = 60_000;
const at = (offsetMs: number) => new Date(Date.now() + offsetMs);
const seller = { sellerId: 'u-seller', sellerName: 'Seller', photoUrl: '' };

async function main() {
  await prisma.auction.deleteMany({ where: { id: { in: ['a-1', 'a-2', 'a-3'] } } });

  await prisma.auction.create({
    data: {
      ...seller,
      id: 'a-1',
      title: 'Vintage Polaroid SX-70 camera',
      startPrice: 10_000,
      minIncrement: 1_000,
      buyNowPrice: 30_000,
      currentPrice: 13_000,
      leaderId: 'u-selvi',
      leaderName: 'Selvi',
      status: 'LIVE',
      endsAt: at(30 * MIN),
      bids: {
        create: [
          { id: 'a-1-b1', userId: 'u-vahe', userName: 'Vahe', amount: 11_000, createdAt: at(-9 * MIN) },
          { id: 'a-1-b2', userId: 'u-anna', userName: 'Anna', amount: 12_000, createdAt: at(-5 * MIN) },
          { id: 'a-1-b3', userId: 'u-selvi', userName: 'Selvi', amount: 13_000, createdAt: at(-2 * MIN) },
        ],
      },
    },
  });

  await prisma.auction.create({
    data: {
      ...seller,
      id: 'a-2',
      title: 'Swiss mechanical watch',
      startPrice: 20_000,
      minIncrement: 1_000,
      buyNowPrice: 60_000,
      currentPrice: 20_000,
      status: 'SCHEDULED',
      startsAt: at(10 * MIN),
      endsAt: at(40 * MIN),
    },
  });

  await prisma.auction.create({
    data: {
      ...seller,
      id: 'a-3',
      title: 'Retro gaming console',
      startPrice: 10_000,
      minIncrement: 500,
      currentPrice: 16_500,
      leaderId: 'u-anna',
      leaderName: 'Anna',
      status: 'ENDED',
      endsAt: at(-30 * MIN),
      bids: { create: [{ id: 'a-3-b1', userId: 'u-anna', userName: 'Anna', amount: 16_500, createdAt: at(-35 * MIN) }] },
      winner: { create: { userId: 'u-anna', userName: 'Anna', finalPrice: 16_500, reason: 'TIMER' } },
    },
  });

  console.log('seeded a-1 (live), a-2 (scheduled), a-3 (ended)');
}

main().finally(() => prisma.$disconnect());
