import { createServer } from 'node:http';

import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';

import { config } from './config';
import { createGateway } from './gateway';
import { auctionsRouter } from './http/auctions';
import { createHttpRateLimit } from './middleware/httpRateLimit';
import { policies } from './rateLimit';
import { startAuctionCloser } from './services/auctionCloser';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', config.TRUST_PROXY);
app.use(cors({ origin: config.CLIENT_URL }));
app.use(createHttpRateLimit('http', policies.http));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/auctions', auctionsRouter);

// Last: turn any thrown/rejected error into a JSON body without stack traces or file paths.
app.use((err: Error & { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  const status = err.status && err.status >= 400 && err.status < 500 ? err.status : 500;
  res.status(status).json({ error: status === 400 ? 'invalid_json' : status < 500 ? 'bad_request' : 'server_error' });
});

const httpServer = createServer(app);
const io = createGateway(httpServer);
startAuctionCloser(io);

httpServer.listen(config.PORT, () => {
  console.log(`[server] listening on http://localhost:${config.PORT}`);
});
