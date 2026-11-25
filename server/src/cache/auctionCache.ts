import type { AuctionSummary } from '@shared/types';
import { redis } from '../redis';

const LIST_TTL_SEC = 5;
const listKey = (status: string, limit: number) => `auctions:list:${status}:${limit}`;

export async function getCachedList(status: string, limit: number): Promise<AuctionSummary[] | null> {
  try {
    const raw = await redis.get(listKey(status, limit));
    return raw ? (JSON.parse(raw) as AuctionSummary[]) : null;
  } catch (err) {
    console.error('getCachedList failed', err);
    return null;
  }
}

export async function cacheList(status: string, limit: number, list: AuctionSummary[]): Promise<void> {
  try {
    await redis.set(listKey(status, limit), JSON.stringify(list), 'EX', LIST_TTL_SEC);
  } catch (err) {
    console.error('cacheList failed', err);
  }
}
