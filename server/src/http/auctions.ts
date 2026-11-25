import { Router } from 'express';
import { createAuctionBody } from '@shared/createAuction';

import { config } from '../config';
import { prisma } from '../db';
import { createLimiter, policies } from '../rateLimit';
import { auctionService } from '../services';
import { scheduleAuctionClose } from '../services/auctionCloser';
import { requireUser, type AuthLocals } from './requireUser';
import { listQuery } from './schema';

export const auctionsRouter = Router();

const createLimit = createLimiter('createAuction', policies.createAuction);

auctionsRouter.post<'/', unknown, unknown, unknown, unknown, AuthLocals>('/', requireUser, async (req, res) => {
  const userId = res.locals.user.id;
  const rl = await createLimit.check(userId);
  if (!rl.allowed) {
    res.status(429).json({ error: 'rate_limited', retryAfterMs: rl.retryAfterMs });
    return;
  }
  const parsed = createAuctionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_body', issues: parsed.error.issues });
    return;
  }
  const open = await prisma.auction.count({ where: { sellerId: userId, status: { in: ['SCHEDULED', 'LIVE'] } } });
  if (open >= config.MAX_OPEN_AUCTIONS_PER_SELLER) {
    res.status(409).json({ error: 'too_many_open_auctions' });
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
  if (auction.status === 'LIVE') {
    scheduleAuctionClose(auction.id, auction.endsAt);
  }
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

auctionsRouter.get('/', async (req, res) => {
  const parsed = listQuery.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_query' });
    return;
  }
  res.json(await auctionService.listAuctions(parsed.data));
});