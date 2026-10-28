import { createServer } from 'node:http';

import cors from 'cors';
import express from 'express';

import { config } from './config';
import { createGateway } from './gateway';
import { auctionsRouter } from './http/auctions';

const app = express();
app.use(cors({ origin: config.CLIENT_URL }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/auctions', auctionsRouter);

const httpServer = createServer(app);
createGateway(httpServer);

httpServer.listen(config.PORT, () => {
  console.log(`[server] listening on http://localhost:${config.PORT}`);
});
