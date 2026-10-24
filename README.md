<div align="center">

# 🔨 <TeamName> Live Auction

**Real-time bidding with server-controlled timers, instant updates, and fair winner selection.**

![Node](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?logo=socket.io)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)

</div>

## 📖 Overview

Users join live auction rooms, place bids, and watch a countdown that is controlled by the server. When time runs out, the highest bidder wins. Users can also end an auction instantly with **Buy now**.

> Part of the **03 Realtime** module.

## ✨ Features

- 🏠 **Live auction rooms:** join/leave, live room state
- 💸 **Real-time bidding:** validated on the server, broadcast to everyone in the room
- ⏱️ **Server-controlled timer:** clients can't cheat the clock
- 🏆 **Winner announcement:** automatic when the timer ends
- 🖥️ **Live screen:** bids, timer, and winner update instantly
- ⚡ **Buy now:** instant purchase that ends the auction

## 🏗️ Architecture

```
React client ──REST──▶ Express ──▶ Auction service ──▶ PostgreSQL
      │                                  ▲
      └────WebSocket (Socket.IO)─────────┘
```

- **Server is the source of truth** for bids, time, and winner.
- **One Socket.IO room per auction.**
- **Bids are processed one at a time per auction** (DB transaction + row lock), so simultaneous bids can't both win.
- **Shared event types** in `/shared` keep client and server in sync.

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Server | Node.js, Express, Socket.IO, TypeScript |
| Database | PostgreSQL |
| Client | React, socket.io-client |

## 📁 Project Structure

```
.
├── server/    # Express + Socket.IO backend
├── client/    # Frontend
├── shared/    # Event types (the event contract)
└── README.md
```

## 🚀 Getting Started

**Prerequisites:** Node.js 20+, PostgreSQL 16+

```bash
git clone <repo-url>
cd <repo-name>

# Server
cd server
npm install
cp .env.example .env     # fill in values
npm run dev

# Client (new terminal)
cd client
npm install
npm run dev
```

**Environment variables (`server/.env`):**

```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/auction
CLIENT_URL=http://localhost:5173
```

## 🔌 Realtime Events

| Event | Direction | Payload |
|---|---|---|
| `join_room` | client → server | `{ auctionId }` |
| `leave_room` | client → server | `{ auctionId }` |
| `room_state` | server → client | `{ auctionId, currentBid, highestBidderId, endsAt }` |
| `place_bid` | client → server | `{ auctionId, amount }` |
| `bid_placed` | server → room | `{ auctionId, userId, amount, createdAt }` |
| `bid_rejected` | server → client | `{ auctionId, reason }` |
| `timer_tick` | server → room | `{ auctionId, remainingMs }` |
| `buy_now` | client → server | `{ auctionId }` |
| `auction_ended` | server → room | `{ auctionId, winnerId, finalPrice, reason }` |

## 🗄️ Database (draft)

| Table | Key fields |
|---|---|
| `users` | id, name, email |
| `auctions` | id, title, start_price, buy_now_price, ends_at, status, winner_id |
| `bids` | id, auction_id, user_id, amount, created_at |

## 👥 Team

| Member | Ownership |
|---|---|
| Vahe Ohanyan | Event contract, rooms, bids, timer, winner, Buy now backend |
| Selvi Hambardzumyan | Event contract, live screen UI, Buy now UI |

## 🌿 Git Workflow

- `main`: stable, protected
- `feature/<name>`: one branch per Jira ticket, merged via pull request
- Commit style: `feat:`, `fix:`, `docs:`, `refactor:`

## 🗺️ Roadmap

- [x] Stack and architecture decided
- [ ] Event contract
- [ ] Auction rooms
- [ ] Bidding
- [ ] Timer and winner
- [ ] Live screen
- [ ] Buy now
- [ ] Anti-sniping (extend timer on late bids)
- [ ] Redis for multi-server scaling
