import { useCountdown } from '../../hooks/useCountdown';
import { useLiveAuction } from '../../hooks/useLiveAuction';
import { useNow } from '../../hooks/useNow';
import { formatCents } from '../../lib/money';
import { formatAgo, formatRemaining } from '../../lib/time';
import type { AuctionEndedEvent } from '@shared/events';
import type { AuctionSnapshot, BidDto } from '@shared/types';

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh w-full cursor-none flex-col bg-black p-[4vmin] text-white select-none">
      {children}
    </main>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <Shell>
      <div className="flex flex-1 flex-col items-center justify-center gap-[3vmin] text-center">{children}</div>
    </Shell>
  );
}

function Skeleton() {
  return (
    <Shell>
      <div className="grid flex-1 animate-pulse gap-[4vmin] lg:grid-cols-2">
        <div className="rounded-3xl bg-zinc-800" />
        <div className="flex flex-col gap-[3vmin]">
          <div className="h-[8vmin] w-3/4 rounded-xl bg-zinc-800" />
          <div className="h-[16vmin] w-2/3 rounded-xl bg-zinc-800" />
          <div className="h-[12vmin] w-1/2 rounded-xl bg-zinc-800" />
          <div className="flex-1 rounded-xl bg-zinc-900" />
        </div>
      </div>
    </Shell>
  );
}

function StartsIn({ auction, offsetMs }: { auction: AuctionSnapshot; offsetMs: number }) {
  const remaining = useCountdown(auction.startsAt ?? auction.endsAt, offsetMs);
  return (
    <Centered>
      <p className="text-[5vmin] font-semibold">{auction.title}</p>
      <p className="text-[4vmin] text-zinc-400">Starts in</p>
      <p className="text-[18vmin] leading-none font-bold tabular-nums">{formatRemaining(remaining)}</p>
      <p className="text-[4vmin] text-zinc-400">Starting at {formatCents(auction.startPrice)}</p>
    </Centered>
  );
}

function Winner({ auction, ended }: { auction: AuctionSnapshot; ended: AuctionEndedEvent }) {
  return (
    <Centered>
      <p className="text-[4vmin] text-zinc-400">{auction.title}</p>
      {ended.winner ? (
        <>
          <p className="text-[16vmin] leading-none font-black text-emerald-400">Sold</p>
          <p className="text-[12vmin] leading-none font-bold tabular-nums">{formatCents(ended.winner.finalPrice)}</p>
          <p className="text-[6vmin]">to {ended.winner.userName}</p>
          {ended.reason === 'buy_now' && <p className="text-[3vmin] text-zinc-400">via Buy now</p>}
        </>
      ) : (
        <p className="text-[14vmin] leading-none font-black text-zinc-500">No bids</p>
      )}
    </Centered>
  );
}

function Timer({ endsAt, offsetMs, extendedAt }: { endsAt: string; offsetMs: number; extendedAt: number | null }) {
  const remaining = useCountdown(endsAt, offsetMs);
  const urgent = remaining <= 10_000;
  return (
    <div className="relative">
      <p className="text-[3vmin] text-zinc-400">Time left</p>
      <p
        className={`text-[14vmin] leading-none font-bold tabular-nums ${urgent ? 'animate-pulse text-red-500' : ''}`}
      >
        {formatRemaining(remaining)}
      </p>
      {extendedAt && (
        <p
          key={extendedAt}
          className="animate-extended absolute top-0 right-0 rounded-full bg-amber-400 px-[2vmin] py-[1vmin] text-[3vmin] font-bold text-black opacity-0"
        >
          Time extended
        </p>
      )}
    </div>
  );
}

function BidsFeed({ bids, offsetMs }: { bids: BidDto[]; offsetMs: number }) {
  const now = useNow(1_000) + offsetMs;
  return (
    <ul className="flex flex-col gap-[1.5vmin] overflow-hidden">
      {bids.slice(0, 5).map((bid) => (
        <li
          key={bid.id}
          className="animate-slide-in flex items-baseline justify-between rounded-xl bg-zinc-900 px-[2.5vmin] py-[1.5vmin] text-[3.5vmin]"
        >
          <span className="font-semibold">{bid.userName}</span>
          <span className="tabular-nums">{formatCents(bid.amount)}</span>
          <span className="text-[2.5vmin] text-zinc-500">{formatAgo(bid.createdAt, now)}</span>
        </li>
      ))}
    </ul>
  );
}

export function LiveScreen({ auctionId }: { auctionId: string }) {
  const { phase, auction, ended, offsetMs, connected, extendedAt } = useLiveAuction(auctionId);

  const badge = phase === 'ready' && !connected && (
    <p className="fixed right-[2vmin] bottom-[2vmin] z-10 animate-pulse rounded-full bg-amber-500 px-[2vmin] py-[0.8vmin] text-[2.2vmin] font-semibold text-black">
      Reconnecting…
    </p>
  );

  if (phase === 'loading') return <Skeleton />;
  if (phase === 'not_found' || !auction) {
    return (
      <Centered>
        <p className="text-[8vmin] font-bold">Auction not found</p>
      </Centered>
    );
  }

  let content;
  if (ended) content = <Winner auction={auction} ended={ended} />;
  else if (auction.status === 'SCHEDULED') content = <StartsIn auction={auction} offsetMs={offsetMs} />;
  else {
    const hasBids = auction.bids.length > 0;
    content = (
      <Shell>
        <div className="grid flex-1 gap-[4vmin] lg:grid-cols-2">
          <section className="flex flex-col gap-[2vmin]">
            {auction.photoUrl ? (
              <img src={auction.photoUrl} alt="" className="min-h-0 flex-1 rounded-3xl object-cover" />
            ) : (
              <div className="min-h-[30vmin] flex-1 rounded-3xl bg-gradient-to-br from-zinc-700 to-zinc-900" />
            )}
            <h1 className="text-[5vmin] leading-tight font-bold">{auction.title}</h1>
            <p className="text-[2.5vmin] text-zinc-400">Sold by {auction.sellerName}</p>
          </section>

          <section className="flex min-h-0 flex-col gap-[3vmin]">
            <div>
              <p className="text-[3vmin] text-zinc-400">{hasBids ? 'Current bid' : 'Starting price'}</p>
              <p
                key={auction.bids[0]?.id}
                className="animate-bid-flash origin-left text-[16vmin] leading-none font-black tabular-nums"
              >
                {formatCents(hasBids ? auction.currentPrice : auction.startPrice)}
              </p>
              <p className="mt-[1vmin] text-[4vmin] text-emerald-400">
                {auction.leaderId ? `${auction.leaderName} is leading` : 'No bids yet'}
              </p>
            </div>
            <Timer endsAt={auction.endsAt} offsetMs={offsetMs} extendedAt={extendedAt} />
            <BidsFeed bids={auction.bids} offsetMs={offsetMs} />
          </section>
        </div>
      </Shell>
    );
  }

  return (
    <>
      {content}
      {badge}
    </>
  );
}
