import type { AuctionSnapshot } from '@shared/events';
import { t } from '../../../i18n';
import { formatPrice } from '../../../lib/money';

export function PriceLeader({ snapshot, userId }: { snapshot: AuctionSnapshot; userId: string | null }) {
  const hasBids = snapshot.leaderId !== null;
  const leader = snapshot.leaderId === userId ? t('price.you') : snapshot.leaderName;

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {hasBids ? t('price.current') : t('price.starting')}
      </p>
      <p className="text-3xl font-extrabold tabular-nums text-slate-900 sm:text-4xl">
        {formatPrice(snapshot.currentPrice, snapshot.currency)}
      </p>
      <p className="mt-1 text-sm text-slate-600">
        {hasBids ? t('price.leader', { name: leader ?? '' }) : t('price.noBids')}
      </p>
    </div>
  );
}
