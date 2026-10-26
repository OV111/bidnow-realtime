import type { BidDto } from '@shared/events';
import { t } from '../../../i18n';
import { formatPrice } from '../../../lib/money';
import { formatClockTime } from '../../../lib/time';

interface Props {
  bids: BidDto[];
  currency: string;
  userId: string | null;
}

export function BidHistory({ bids, currency, userId }: Props) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-base font-semibold text-slate-900">{t('history.title')}</h2>
        {bids.length > 0 && <span className="text-xs text-slate-500">{t('history.count', { count: bids.length })}</span>}
      </div>
      {bids.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">{t('history.empty')}</p>
      ) : (
        <ol className="divide-y divide-slate-100" aria-label={t('history.title')}>
          {bids.map((bid, i) => {
            const mine = bid.userId === userId;
            return (
              <li key={bid.id} className={`flex items-center justify-between py-2 text-sm ${i === 0 ? 'font-semibold' : ''}`}>
                <span className={mine ? 'text-indigo-700' : 'text-slate-700'}>
                  {mine ? t('price.you') : bid.userName}
                </span>
                <span className="flex items-baseline gap-3">
                  <span className="tabular-nums text-slate-900">{formatPrice(bid.amount, currency)}</span>
                  <time dateTime={bid.createdAt} className="text-xs font-normal tabular-nums text-slate-400">
                    {formatClockTime(bid.createdAt)}
                  </time>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
