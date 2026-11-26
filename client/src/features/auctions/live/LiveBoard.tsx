import type { AuctionSnapshot } from '@shared/types';

import BidsFeed from '@/features/auctions/live/BidsFeed';
import LiveFrame from '@/features/auctions/live/LiveFrame';
import Timer from '@/features/auctions/live/Timer';
import { t } from '@/i18n';
import { formatPrice } from '@/lib/price';

interface Props {
  auction: AuctionSnapshot;
  clockOffsetMs: number;
  extendedAt: number | null;
}

function LiveBoard({ auction, clockOffsetMs, extendedAt }: Props) {
  const hasBids = auction.bids.length > 0;

  return (
    <LiveFrame>
      <div className="grid flex-1 gap-[4vmin] lg:grid-cols-2">
        <section className="flex flex-col gap-[2vmin]">
          {auction.photoUrl ? (
            <img src={auction.photoUrl} alt="" className="min-h-0 flex-1 rounded-3xl object-cover" />
          ) : (
            <div className="min-h-[30vmin] flex-1 rounded-3xl bg-gradient-to-br from-zinc-700 to-zinc-900" />
          )}
          <h1 className="text-[5vmin] leading-tight font-bold">{auction.title}</h1>
          <p className="text-[2.5vmin] text-zinc-400">{t('item.seller', { name: auction.sellerName })}</p>
        </section>

        <section className="flex min-h-0 flex-col gap-[3vmin]">
          <div>
            <p className="text-[3vmin] text-zinc-400">{hasBids ? t('price.current') : t('live.startingPrice')}</p>
            <p
              key={auction.bids[0]?.id}
              className="animate-bid-flash origin-left text-[16vmin] leading-none font-black tabular-nums"
            >
              {formatPrice(hasBids ? auction.currentPrice : auction.startPrice, auction.currency)}
            </p>
            <p className="mt-[1vmin] text-[4vmin] text-emerald-400">
              {auction.leaderId ? t('live.leading', { name: auction.leaderName ?? '' }) : t('price.noBids')}
            </p>
          </div>
          <Timer endsAt={auction.endsAt} clockOffsetMs={clockOffsetMs} extendedAt={extendedAt} />
          <BidsFeed bids={auction.bids} currency={auction.currency} clockOffsetMs={clockOffsetMs} />
        </section>
      </div>
    </LiveFrame>
  );
}

export default LiveBoard;
