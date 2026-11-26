import type { BidDto } from '@shared/types';

import useNow from '@/hooks/useNow';
import { formatPrice } from '@/lib/price';
import { formatTimeAgo } from '@/lib/time';

interface Props {
  bids: BidDto[];
  currency: string;
  clockOffsetMs: number;
}

function BidsFeed({ bids, currency, clockOffsetMs }: Props) {
  const now = useNow() + clockOffsetMs;

  return (
    <ul className="flex flex-col gap-[1.5vmin] overflow-hidden">
      {bids.slice(0, 5).map((bid) => (
        <li
          key={bid.id}
          className="animate-slide-in flex items-baseline justify-between rounded-xl bg-zinc-900 px-[2.5vmin] py-[1.5vmin] text-[3.5vmin]"
        >
          <span className="font-semibold">{bid.userName}</span>
          <span className="tabular-nums">{formatPrice(bid.amount, currency)}</span>
          <span className="text-[2.5vmin] text-zinc-500">{formatTimeAgo(bid.createdAt, now)}</span>
        </li>
      ))}
    </ul>
  );
}

export default BidsFeed;
