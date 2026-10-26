import type { AuctionSnapshot } from '@shared/events';
import { t } from '../../../i18n';
import { formatPrice } from '../../../lib/money';

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
