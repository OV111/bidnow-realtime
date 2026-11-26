import type { AuctionSnapshot } from '@shared/types';

import StatusBadge from '@/features/auctions/StatusBadge';
import useCountdown from '@/features/auctions/useCountdown';
import { t } from '@/i18n';
import { formatPrice } from '@/lib/price';
import { formatCountdown } from '@/lib/time';

interface Props {
  auction: AuctionSnapshot;
  userId: string | null;
  clockOffsetMs: number;
}

function PriceBoard({ auction, userId, clockOffsetMs }: Props) {
  const startsAt = auction.status === 'SCHEDULED' ? auction.startsAt : null;
  const remaining = useCountdown(startsAt ?? auction.endsAt, clockOffsetMs);
  const hasBids = auction.leaderId !== null;
  const leader = auction.leaderId === userId ? t('price.you') : auction.leaderName;
  const urgent = auction.status === 'LIVE' && remaining <= 60_000;

  return (
    <>
      <div className="flex items-center justify-between">
        <StatusBadge status={auction.status} />
        {auction.viewers > 0 && (
          <span className="text-xs text-slate-500">{t('viewers.count', { count: auction.viewers })}</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {hasBids ? t('price.current') : t('price.starting')}
          </p>
          <p className="text-3xl font-extrabold tabular-nums text-slate-900 sm:text-4xl">
            {formatPrice(auction.currentPrice, auction.currency)}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {hasBids ? t('price.leader', { name: leader ?? '' }) : t('price.noBids')}
          </p>
        </div>

        {auction.status === 'ENDED' ? (
          <p className="text-lg font-semibold text-slate-500">{t('timer.ended')}</p>
        ) : (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {startsAt ? t('timer.startsIn') : t('timer.endsIn')}
            </p>
            <p className={`text-2xl font-bold tabular-nums sm:text-3xl ${urgent ? 'text-red-600' : 'text-slate-900'}`}>
              {formatCountdown(remaining)}
            </p>
          </div>
        )}
      </div>
    </>
  );
}

export default PriceBoard;
