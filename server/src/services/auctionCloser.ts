import { auctionRoom } from "@shared/events";

import { prisma } from '../db';
import type { AppServer } from "../gateway/types";
import { auctionService } from ".";

export function startAuctionCloser(io: AppServer, intervalMs: number = 1000) {
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
        const ended = await auctionService.closeAuction(id);
        if (!ended) continue;
        io.to(auctionRoom(id)).emit('auction:ended', ended);
      }
    } catch (err) {
      console.log("failed", err)
    } finally {
      running = false;
    }
  }
  const timer = setInterval(tick, intervalMs);
  return () => { return clearInterval(timer) };
}