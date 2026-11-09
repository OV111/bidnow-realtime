import { auctionRoom } from "@shared/events";

import { prisma } from '../db';
import type { AppServer } from "../gateway/types";
import { auctionService } from ".";

const MAX_TIMER_MS = 60 * 60_000;
const timers = new Map<string, NodeJS.Timeout>();
let closeAndBroadcast: ((auctionId: string) => Promise<void>) | null = null;

export function scheduleClose(auctionId: string, endsAt: string) {
  cancelClose(auctionId);
  const delay = Math.max(0, new Date(endsAt).getTime() - Date.now());
  if (delay > MAX_TIMER_MS) return;
  timers.set(auctionId, setTimeout(() => {
    timers.delete(auctionId);
    void closeAndBroadcast?.(auctionId);
  }, delay));
}

export function cancelClose(auctionId: string) {
  clearTimeout(timers.get(auctionId));
  timers.delete(auctionId);
}

export function startAuctionCloser(io: AppServer, intervalMs: number = 1000) {
  closeAndBroadcast = async (auctionId) => {
    try {
      const ended = await auctionService.closeAuction(auctionId);
      if (ended) io.to(auctionRoom(auctionId)).emit('auction:ended', ended);
    } catch (err) {
      console.log("failed", err)
    }
  };

  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const expiredAuctions = await prisma.auction.findMany({
        where: { status: 'LIVE', endsAt: { lte: new Date() } },
        select: { id: true },
        take: 100,
      })
      for (const { id } of expiredAuctions) {
        cancelClose(id);
        await closeAndBroadcast?.(id);
      }
    } catch (err) {
      console.log("failed", err)
    } finally {
      running = false;
    }
  }

  void prisma.auction
    .findMany({ where: { status: 'LIVE', endsAt: { gt: new Date() } }, select: { id: true, endsAt: true } })
    .then((live) => live.forEach(({ id, endsAt }) => scheduleClose(id, endsAt.toISOString())))
    .catch((err) => console.log("failed to schedule live auctions", err));

  const timer = setInterval(tick, intervalMs);
  return () => {
    clearInterval(timer);
    timers.forEach(clearTimeout);
    timers.clear();
  };
}
