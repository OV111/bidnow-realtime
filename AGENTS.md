# BidNow: notes for agents

Real-time auctions. `client/` is React, `server/` is Express and Socket.IO, and `shared/` holds the contract between them. Setup is in [README.md](README.md). Working in `client/`? Read [client/AGENTS.md](client/AGENTS.md). Working in `server/`? Read [server/AGENTS.md](server/AGENTS.md).

## Rules

- `shared/` is the contract. If you change an event or type there, update both the client and the server in the same change.
- Prices are integer cents everywhere. Convert to dollars only for display or input.
- The server decides prices, timers and winners. Client checks exist to help the user, never to protect anything.
- Errors crossing the wire are short snake_case codes (`too_low`, `not_live`), never sentences. The client turns them into text.
- Never commit `.env` files or real tokens. A new env var goes in `server/src/config.ts` and the matching `.env.example` in the same change.
- Don't commit or push unless asked.

## Shared

Imported as `@shared/...` from both sides. `zod` is in the root `package.json` because `shared/` imports it and resolves packages from the root. Keep it there.

- `types.ts`: data shapes the server returns (`AuctionSnapshot`, `BidDto`, ...).
- `events.ts`: socket event names, payloads and error codes (`BidError`, `BuyNowError`).
- `createAuction.ts`: create-auction rules in one zod schema, used by `POST /auctions` and the client form.
- `auction-service.ts`: the interface the server's auction service implements.

## Running locally

- `npm run db:up` starts Postgres (5432), Redis (6379) and RabbitMQ. If it fails on a port, another container holds it: check `docker ps`.
- The server needs Redis even when `REDIS_URL` is empty: Socket.IO and the list cache use it. Rate limits fall back to memory without it.
- `npm run dev:client` alone uses mock data only when `VITE_SOCKET_URL` is empty in `client/.env`.
- `infra/nginx` serves everything on :8080 (client, `/auctions`, `/socket.io`). Only needed to test behind a proxy.

## Check your work

| Changed | Run |
|---|---|
| `client/` | `npm run build --prefix client` and `npm run lint --prefix client` |
| `server/` | `npm run typecheck --prefix server` |
| `shared/` | `npm run check` (all of the above, from the root) |
| `server/prisma/schema.prisma` | a new migration (see server/AGENTS.md), then the server checks |

End-to-end tests run from `server/` with `npx vitest run`. They need the server running and the database seeded. The client has no tests, so open the page you changed.
