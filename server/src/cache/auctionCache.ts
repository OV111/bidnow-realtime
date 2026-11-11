import { redis } from "../redis";
import { AuctionState } from "@shared/auction-service";

const key = (id: string) => `auction:${id}`

export async function cacheAuction(state: AuctionState): Promise<void> {
  try {
    const secondsLeft = Math.ceil((new Date(state.endsAt).getTime() - Date.now()) / 1000)
    await redis.set(key(state.id), JSON.stringify(state), 'EX', Math.max(60, secondsLeft + 3600))
  } catch(err) {
    console.log('cacheAuction falied',err)
  }
}

export async function getCachedAuction(id: string): Promise<AuctionState | null> {
  try {
    const raw = await redis.get(key(id));
    if (raw) {
      return JSON.parse(raw) as AuctionState;
    } else {
      return null;
    }
  } catch (err) {
    console.log('getCachedAuction failed', err)
    return null;
  }
}

export async function deleteCachedAuction(id: string): Promise<void> {
  try {
    await redis.del(key(id))
  } catch (err) {
    console.log("Deletion of cached auction failed", err)
  }
}