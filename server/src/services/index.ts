import type { AuctionService } from '@shared/auction-service';

import { PrismaAuctionService } from './prismaAuctionService';

export const auctionService: AuctionService & Pick<PrismaAuctionService, 'createAuction'> =
  new PrismaAuctionService();
