import type { AuctionSnapshot } from '@shared/types';

import { t } from '@/i18n';
import { formatPrice } from '@/lib/price';

function AuctionDetails({ auction }: { auction: AuctionSnapshot }) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="aspect-[4/3] w-full bg-slate-100">
        {auction.photoUrl && (
          <img src={auction.photoUrl} alt={auction.title} className="h-full w-full object-cover" loading="eager" />
        )}
      </div>
      <div className="space-y-2 p-4">
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{auction.title}</h1>
        <p className="text-sm text-slate-500">{t('item.seller', { name: auction.sellerName })}</p>
        <p className="text-sm text-slate-500">
          {t('item.startPrice', { price: formatPrice(auction.startPrice, auction.currency) })}
        </p>
        {auction.description && <p className="whitespace-pre-line pt-2 text-sm text-slate-700">{auction.description}</p>}
      </div>
    </section>
  );
}

export default AuctionDetails;
