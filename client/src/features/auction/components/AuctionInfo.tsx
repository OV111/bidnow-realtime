import type { AuctionSnapshot } from '@shared/types';
import { t } from '../../../i18n';
import { formatPrice } from '../../../lib/money';
import type { Standing } from '../helpers';

export function ItemInfo({ snapshot }: { snapshot: AuctionSnapshot }) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="aspect-[4/3] w-full bg-slate-100">
        {snapshot.photoUrl && (
          <img src={snapshot.photoUrl} alt={snapshot.title} className="h-full w-full object-cover" loading="eager" />
        )}
      </div>
      <div className="space-y-2 p-4">
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{snapshot.title}</h1>
        <p className="text-sm text-slate-500">{t('item.seller', { name: snapshot.sellerName })}</p>
        <p className="text-sm text-slate-500">
          {t('item.startPrice', { price: formatPrice(snapshot.startPrice, snapshot.currency) })}
        </p>
        {snapshot.description && <p className="whitespace-pre-line pt-2 text-sm text-slate-700">{snapshot.description}</p>}
      </div>
    </section>
  );
}

export function ViewersCount({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
        <path d="M10 4C5 4 1.7 8.2 1 10c.7 1.8 4 6 9 6s8.3-4.2 9-6c-.7-1.8-4-6-9-6Zm0 10a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-6a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
      </svg>
      {t('viewers.count', { count })}
    </span>
  );
}

export function GuestBidPrompt() {
  return (
    <div className="space-y-3 rounded-xl bg-slate-50 p-4 text-center ring-1 ring-slate-200">
      <p className="text-sm font-medium text-slate-700">{t('guest.title')}</p>
      <button type="button" className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-500">
        {t('guest.cta')}
      </button>
    </div>
  );
}

export function StandingIndicator({ standing }: { standing: Standing }) {
  if (standing === 'none') return null;
  const winning = standing === 'winning';
  return (
    <div
      className={`rounded-lg px-3 py-2 text-sm font-semibold ${
        winning ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200' : 'bg-red-50 text-red-800 ring-1 ring-red-200'
      }`}
    >
      {winning ? t('standing.winning') : t('standing.outbid')}
    </div>
  );
}
