import { prisma } from '../src/db';

const MIN = 60_000;
const at = (offsetMs: number) => new Date(Date.now() + offsetMs);
const seller = { sellerId: 'u-seller', sellerName: 'Seller', photoUrl: '' };

async function main() {
  const ids = ['a-1', 'a-2', 'a-3', 'a-4', 'a-5', 'a-6', 'a-7', 'a-8', 'a-9'];
  await prisma.auction.deleteMany({ where: { id: { in: ids } } });

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

  // a-4: closes in 90s, Anna leading, to watch the real close + winner
  await prisma.auction.create({
    data: {
      ...seller, id: 'a-4', title: 'Ending soon: vinyl record set',
      startPrice: 5_000, minIncrement: 500, currentPrice: 6_000,
      leaderId: 'u-anna', leaderName: 'Anna', status: 'LIVE', endsAt: at(90_000),
      bids: { create: [{ id: 'a-4-b1', userId: 'u-anna', userName: 'Anna', amount: 6_000, createdAt: at(-1 * MIN) }] },
    },
  });

  // a-5: live, no bids yet
  await prisma.auction.create({
    data: {
      ...seller, id: 'a-5', title: 'Leather messenger bag',
      startPrice: 8_000, minIncrement: 500, currentPrice: 8_000,
      status: 'LIVE', endsAt: at(60 * MIN),
    },
  });

  // a-6: buy now + lots of bids
  await prisma.auction.create({
    data: {
      ...seller, id: 'a-6', title: 'Mountain bike',
      startPrice: 50_000, minIncrement: 2_000, buyNowPrice: 120_000, currentPrice: 62_000,
      leaderId: 'u-selvi', leaderName: 'Selvi', status: 'LIVE', endsAt: at(2 * 60 * MIN),
      bids: {
        create: [
          { id: 'a-6-b1', userId: 'u-anna', userName: 'Anna', amount: 52_000, createdAt: at(-30 * MIN) },
          { id: 'a-6-b2', userId: 'u-vahe', userName: 'Vahe', amount: 54_000, createdAt: at(-25 * MIN) },
          { id: 'a-6-b3', userId: 'u-selvi', userName: 'Selvi', amount: 56_000, createdAt: at(-20 * MIN) },
          { id: 'a-6-b4', userId: 'u-anna', userName: 'Anna', amount: 58_000, createdAt: at(-12 * MIN) },
          { id: 'a-6-b5', userId: 'u-vahe', userName: 'Vahe', amount: 60_000, createdAt: at(-6 * MIN) },
          { id: 'a-6-b6', userId: 'u-selvi', userName: 'Selvi', amount: 62_000, createdAt: at(-2 * MIN) },
        ],
      },
    },
  });

  // a-7: ended, nobody bid
  await prisma.auction.create({
    data: {
      ...seller, id: 'a-7', title: 'Old encyclopedia set',
      startPrice: 3_000, minIncrement: 500, currentPrice: 3_000,
      status: 'ENDED', endsAt: at(-2 * 60 * MIN),
    },
  });

  // a-8: Vahe is the seller
  await prisma.auction.create({
    data: {
      id: 'a-8', title: "Vahe's film camera lens", photoUrl: '',
      sellerId: 'u-vahe', sellerName: 'Vahe',
      startPrice: 15_000, minIncrement: 1_000, currentPrice: 16_000,
      leaderId: 'u-anna', leaderName: 'Anna', status: 'LIVE', endsAt: at(5 * MIN),
      bids: { create: [{ id: 'a-8-b1', userId: 'u-anna', userName: 'Anna', amount: 16_000, createdAt: at(-1 * MIN) }] },
    },
  });

  // a-9: ended through buy now
  await prisma.auction.create({
    data: {
      ...seller, id: 'a-9', title: 'Espresso machine',
      startPrice: 20_000, minIncrement: 1_000, buyNowPrice: 45_000, currentPrice: 45_000,
      leaderId: 'u-selvi', leaderName: 'Selvi', status: 'ENDED', endsAt: at(-10 * MIN),
      winner: { create: { userId: 'u-selvi', userName: 'Selvi', finalPrice: 45_000, reason: 'BUY_NOW' } },
    },
  });

  console.log('seeded a-1..a-9');
}

main().finally(() => prisma.$disconnect());
