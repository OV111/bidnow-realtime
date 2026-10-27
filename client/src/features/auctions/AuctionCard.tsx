import { Link } from 'react-router-dom';
import type { AuctionSummary } from '@shared/types';
import { StatusBadge } from '../../components/StatusBadge';
import { t } from '../../i18n';
import { formatPrice } from '../../lib/money';
import { formatCountdown } from '../../lib/time';
import { useNow } from '../../lib/useNow';

export function AuctionCard({ auction }: { auction: AuctionSummary }) {
  const now = useNow();
  const upcoming = auction.status === 'SCHEDULED' && auction.startsAt;
  const remaining = new Date(upcoming ? auction.startsAt! : auction.endsAt).getTime() - now;
  const live = auction.status === 'LIVE';

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="relative aspect-[4/3] bg-slate-100">
        {auction.photoUrl && <img src={auction.photoUrl} alt={auction.title} className="h-full w-full object-cover" />}
        <div className="absolute left-2 top-2">
          <StatusBadge status={auction.status} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h2 className="line-clamp-2 font-semibold text-slate-900">{auction.title}</h2>
        <div className="flex items-baseline justify-between">
          <span className="text-lg font-bold tabular-nums text-slate-900">{formatPrice(auction.currentPrice)}</span>
          <span className="text-xs text-slate-500">{t('list.bids', { count: auction.bidCount })}</span>
        </div>
        {auction.status !== 'ENDED' && (
          <p className="text-xs text-slate-500">
            {upcoming ? t('timer.startsIn') : t('timer.endsIn')}{' '}
            <span className="font-semibold tabular-nums text-slate-700">{formatCountdown(remaining)}</span>
          </p>
        )}
        <Link
          to={`/auctions/${auction.id}`}
          className={`mt-auto block rounded-xl px-4 py-2.5 text-center text-sm font-semibold ${
            live ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
          }`}
        >
          {live ? t('list.join') : t('list.view')}
        </Link>
      </div>
    </article>
  );
}
