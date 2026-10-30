import { createServer } from 'node:http';

import cors from 'cors';
import express from 'express';

import { config } from './config';
import { createGateway } from './gateway';
import { auctionsRouter } from './http/auctions';
import { createHttpRateLimit } from './middleware/httpRateLimit';
import { policies } from './rateLimit';
import { startAuctionCloser } from './services/auctionCloser';

const app = express();
app.use(cors({ origin: config.CLIENT_URL }));
app.use(createHttpRateLimit('http', policies.http));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/auctions', auctionsRouter);

const httpServer = createServer(app);
const io = createGateway(httpServer);
startAuctionCloser(io);

httpServer.listen(config.PORT, () => {
  console.log(`[server] listening on http://localhost:${config.PORT}`);
});
