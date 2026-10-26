import { useState } from 'react';

import { useCountdown } from '../../hooks/useCountdown';
import { formatCents } from '../../lib/money';
import { formatRemaining } from '../../lib/time';
import { createMockAuction, USER_NAMES } from '../../mocks/auction';

export function AuctionPage() {
  const [auction] = useState(createMockAuction);
  const remaining = useCountdown(auction.endsAt);

  return (
    <main className="mx-auto max-w-xl space-y-4 p-4">
      <h1 className="text-2xl font-semibold">{auction.title}</h1>

      <div className="flex justify-between">
        <div>
          <p className="text-sm text-zinc-500">Current bid</p>
          <p className="text-3xl font-semibold">{formatCents(auction.currentPrice)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-zinc-500">Time left</p>
          <p className="text-3xl font-semibold tabular-nums">{formatRemaining(remaining)}</p>
        </div>
      </div>

      <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
        <input type="number" className="flex-1 rounded border px-3 py-2" placeholder="Your bid" />
        <button className="rounded bg-zinc-900 px-4 py-2 text-white">Bid</button>
      </form>

      <ul className="divide-y rounded border">
        {auction.bids.map((bid) => (
          <li key={bid.id} className="flex justify-between px-3 py-2">
            <span>{USER_NAMES[bid.userId] ?? bid.userId}</span>
            <span className="tabular-nums">{formatCents(bid.amount)}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
