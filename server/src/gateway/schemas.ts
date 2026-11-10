import z from "zod";

export const bidSchema = z.object({
  auctionId: z.string(),
  amount: z.number().int().positive(),
});

export const auctionIdSchema = z.object({
  auctionId: z.string(),
});