# BidNow client

React, Vite, TypeScript and Tailwind CSS.

## Run

```bash
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173.

## Environment

| Variable | Meaning |
|---|---|
| `VITE_SOCKET_URL` | Server URL, `http://localhost:4000` locally. Required for production builds. |
| `VITE_API_URL` | HTTP API URL. Leave empty when it is the same server as the socket. |

To work on the UI without the server, leave `VITE_SOCKET_URL` empty. Development then runs on the mock data in `src/mock/`.

## Pages

| Path | Page |
|---|---|
| `/auctions` | List: live, upcoming, all |
| `/auctions/new` | Create an auction |
| `/auctions/:id` | Watch and bid. Add `?guest=1` to view logged out. |
| `/auctions/:id/live` | Big-screen view |

With mock data, try `/auctions/vintage-camera`. To bid as the mock user "You", open it once with `?token=e30.eyJzdWIiOiJtZSJ9.mock`. The token is saved, so later visits are logged in too. Other users place bids every few seconds.

There is no login page yet. In development, add `?token=<jwt>` to an auction page URL. Create a token with `npm run token -- <userId>` in `server/`.

## Commands

| Command | Does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Type check and production build |
| `npm run lint` | ESLint |
| `npm run preview` | Serve the production build |

## More

- [AGENTS.md](AGENTS.md): folder structure and code style
- [docs/live-auction.md](docs/live-auction.md): how the live auction connection works
