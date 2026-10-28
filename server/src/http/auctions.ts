import { Router } from 'express';
import { z } from 'zod';

import { auctionService } from '../services';
import { requireUser, type AuthLocals } from './requireUser';

const cents = z.number().int().positive();

const createAuctionBody = z
  .object({
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(2000).nullish(),
    photoUrl: z.url(),
    currency: z.string().regex(/^[A-Z]{3}$/).default('USD'),
    startPrice: cents,
    minIncrement: cents,
    buyNowPrice: cents.nullish(),
    startsAt: z.iso.datetime().nullish(),
    endsAt: z.iso.datetime(),
  })
  .refine((b) => b.buyNowPrice == null || b.buyNowPrice > b.startPrice, {
    path: ['buyNowPrice'],
    message: 'buyNowPrice must be greater than startPrice',
  })
  .refine((b) => new Date(b.endsAt).getTime() > Date.now(), {
    path: ['endsAt'],
    message: 'endsAt must be in the future',
  })
  .refine((b) => !b.startsAt || new Date(b.startsAt) < new Date(b.endsAt), {
    path: ['startsAt'],
    message: 'startsAt must be before endsAt',
  });

export const auctionsRouter = Router();

auctionsRouter.post<'/', unknown, unknown, unknown, unknown, AuthLocals>('/', requireUser, async (req, res) => {
  const parsed = createAuctionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_body', issues: parsed.error.issues });
    return;
  }
  const body = parsed.data;
  const auction = await auctionService.createAuction(res.locals.user, {
    ...body,
    description: body.description ?? null,
    buyNowPrice: body.buyNowPrice ?? null,
    startsAt: body.startsAt ? new Date(body.startsAt) : null,
    endsAt: new Date(body.endsAt),
  });
  res.status(201).json(auction);
});

auctionsRouter.get('/:id', async (req, res) => {
  const state = await auctionService.getState(req.params.id);
  if (!state) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  res.json({ ...state, serverTime: new Date().toISOString() });
});
