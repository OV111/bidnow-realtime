import type { AuctionSnapshot } from '@shared/types';

import LiveFrame from '@/features/auctions/live/LiveFrame';
import useCountdown from '@/features/auctions/useCountdown';
import { t } from '@/i18n';
import { formatPrice } from '@/lib/price';
import { formatCountdown } from '@/lib/time';

function StartingSoon({ auction, clockOffsetMs }: { auction: AuctionSnapshot; clockOffsetMs: number }) {
  const remaining = useCountdown(auction.startsAt ?? auction.endsAt, clockOffsetMs);
  const startPrice = formatPrice(auction.startPrice, auction.currency);

  return (
    <LiveFrame centered>
      <p className="text-[5vmin] font-semibold">{auction.title}</p>
      <p className="text-[4vmin] text-zinc-400">{t('timer.startsIn')}</p>
      <p className="text-[18vmin] leading-none font-bold tabular-nums">{formatCountdown(remaining)}</p>
      <p className="text-[4vmin] text-zinc-400">{t('live.startingAt', { price: startPrice })}</p>
    </LiveFrame>
  );
}

export default StartingSoon;
