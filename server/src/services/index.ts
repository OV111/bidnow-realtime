
import type { AuctionService } from '@shared/auction-service';

import { MockAuctionService } from './mockAuctionService';

//waiting for Selvi for changes
export const auctionService: AuctionService = new MockAuctionService();