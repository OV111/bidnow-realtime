npm run db:up           # start Postgres + RabbitMQ (not needed for the UI)
npm run dev             # start server and client together
npm run dev:client      # start only the client (UI runs on mock data)
npm run dev:server      # start only the server
npm run install:all     # install server and client dependencies

Pages (client, http://localhost:5173)
/auctions               # auctions list (Live / Upcoming / All)
/auctions/:id           # auction page, e.g. /auctions/vintage-camera
/auctions/:id?guest=1   # same page as a logged-out user

Mock data
client/src/mock/auctions.ts   # auctions, bids and the current user
shared/events.ts              # data shapes the backend should return
