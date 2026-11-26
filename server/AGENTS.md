# Server: notes for agents

Read the root [AGENTS.md](../AGENTS.md) first.

## Where code goes

```
src/
  server.ts       Express app, final error handler, starts gateway and closer
  config.ts       every env var, validated with zod
  db.ts, redis.ts Prisma and Redis clients
  http/           REST routes (/auctions)
  gateway/        Socket.IO handlers: rooms, bids, buy now
  services/       auction rules (prismaAuctionService) and auctionCloser
  cache/          Redis cache for the auction list
  rateLimit/      token bucket policies and stores
  middleware/     HTTP and socket rate limits, client IP
  auth/           JWT and mock users
  notifications/  optional outgoing webhook (USER_FLOW_*)
```

- Business rules (bid too low, not live, own auction) go in `services/`. Handlers in `gateway/` and `http/` only check input, call the service and send the result.
- Read env through `config` from `config.ts`, never `process.env`.
- `services/mockAuctionService.ts` is not used. Don't build on it.

## Handlers

- Socket handlers that need a user go through `guard()` in `gateway/guard.ts`: it checks the token, the rate limit and the zod payload, in that order.
- Payload schemas live in `gateway/schemas.ts`, HTTP query schemas in `http/schema.ts`, the create body in `@shared/createAuction`.
- Socket events reply with an ack: `{ ok: true, data }` or `{ ok: false, error: code }`. Error codes must exist in `@shared/events`.
- Catch errors in socket handlers and ack `server_error`. HTTP errors fall through to the handler in `server.ts`.
- When an auction's end time is set or changes, call `scheduleAuctionClose`. The closer also sweeps every 5 seconds as a backup.

## Database

- Schema change: edit `prisma/schema.prisma`, then `npm run db:migrate -- --name <what_changed>`. Commit the new folder in `prisma/migrations/`.
- Never edit a migration that is already committed.
- After pulling new migrations: `npm run db:deploy` and `npm run db:generate`. From the root, `npm run db:setup` does both plus the seed.
- Format with `npm run format` (Prettier, `.prettierrc`). It rewrites files, so run it as its own commit.
- Seed data is in `prisma/seed.ts` (`npm run db:seed`).

## Auth

There is no sign-up. Users are the mock users in `src/auth/mockUsers.ts` (`u-vahe`, `u-anna`, `u-seller`, ...). Get a JWT with `npm run token -- <userId>`.

## Scripts

- `npm run socket:test -- <auctionId> [userId|guest] [amount]`: join a room and bid from the terminal.
- `npm run bid:spam -- <auctionId> <userId> [count]`: send many bids at once to check the rate limit.
- `npm run perf`: bid and join timings. Compare before and after a change to a hot path.

## Before you finish

```bash
npm run typecheck
npm test
```

Typecheck must pass. Run the e2e tests when you touch `gateway/` or `services/`; they need the server running and the database seeded.
