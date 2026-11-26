# How a live auction works in the client

Everything goes through `useLiveAuction(auctionId, token)` in `src/features/auctions/useLiveAuction.ts`. The bidding page and the big screen both use it. The event types are in `shared/events.ts`.

## Joining

1. The hook opens a socket. Without `VITE_SOCKET_URL`, development uses the mock socket instead.
2. On `connect` it emits `auction:join` and gets back a full `AuctionSnapshot`.
3. After a reconnect, `connect` fires again, so the hook rejoins and replaces its state with a fresh snapshot. That is how missed events are recovered.

A guest has no token. They can watch but not bid.

## Phases

| Phase | Meaning |
|---|---|
| `loading` | Waiting for the first snapshot |
| `ready` | Showing an auction |
| `not_found` | The server says it doesn't exist |
| `error` | Setup, the handshake or the join failed |

While disconnected, `connected` is false and the page keeps showing the last state with a reconnecting banner. If the rejoin after a reconnect fails, the phase becomes `error`: the big screen keeps the last state, the bidding page shows the error screen.

## Events

| Event | What changes |
|---|---|
| `bid:placed` | Price, leader, end time, bid history. Repeated bid ids are ignored. |
| `timer:extended` | End time |
| `auction:started` | Status becomes `LIVE` |
| `auction:ended` | Status becomes `ENDED`, winner is set |
| `viewers:update` | Viewer count |
| `auth:expired` | `sessionExpired` becomes true |

Events for a different auction are ignored.

## Bidding

`placeBid` and `buyNow` resolve with `{ ok: true, data }` or `{ ok: false, error }`. The client adds two errors of its own:

- `offline`: the socket wasn't connected, so nothing was sent.
- `timeout`: no reply in 5 seconds. The bid may still have gone through, so don't retry automatically.

The price on screen changes when `bid:placed` arrives, not when the button is clicked.

Each error code has a text key with the same name: `bid.error.<code>` and `buyNow.error.<code>` in `src/i18n/en.ts`. A new error code in `shared/` fails the build until that key exists.
