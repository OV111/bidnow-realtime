# BidNow Live Auction

Real-time auctions: users join a room, place bids and watch a countdown controlled by the server. The highest bidder wins when time runs out, or anyone can end the auction with **Buy now**.

## Features

- Live bidding, validated on the server and broadcast to the room
- Server-controlled timer with anti-sniping
- Buy now
- Scheduled auctions and automatic closing
- Create auction page and auction list
- Rate limiting

## Stack

- **Server:** Node.js, TypeScript, Express, Socket.IO, Prisma
- **Data:** PostgreSQL, Redis
- **Client:** React, Vite, Tailwind CSS

## Structure

```
client/   React app
server/   API, Socket.IO gateway, database
shared/   Types and events used by both
infra/    nginx config
```

## Run locally

Needs a recent Node.js LTS and Docker.

```bash
npm run install:all
cp server/.env.example server/.env
cp client/.env.example client/.env
npm run db:up
npm run db:setup
npm run dev
```

Open http://localhost:5173.

## Commands

Run from the repo root:

| Command | Does |
|---|---|
| `npm run install:all` | Install root, server and client dependencies |
| `npm run db:up` | Start Postgres, Redis and RabbitMQ |
| `npm run dev` | Start server and client together |
| `npm run dev:client` | Start only the client (mock data if `VITE_SOCKET_URL` is empty) |
| `npm run dev:server` | Start only the server |

Pages, mock data and the mock login are described in [client/README.md](client/README.md). The data shapes shared by client and server are in `shared/types.ts` and `shared/events.ts`.

## Tests

Run in `server/` while the server is running:

```bash
npx vitest run   # end-to-end tests
npm run perf     # bid and join timings
```
