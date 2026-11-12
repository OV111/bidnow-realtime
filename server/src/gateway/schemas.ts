import z from "zod";
import { MAX_PRICE_CENTS } from "@shared/createAuction";

export const bidSchema = z.object({
  auctionId: z.string(),
  amount: z.number().int().positive().max(MAX_PRICE_CENTS),
});

export const auctionIdSchema = z.object({
  auctionId: z.string(),
});