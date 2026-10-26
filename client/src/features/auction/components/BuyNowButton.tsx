import type { AuctionSnapshot } from '@shared/events';
import { t } from '../../../i18n';
import { formatPrice } from '../../../lib/money';

export function BuyNowButton({ snapshot }: { snapshot: AuctionSnapshot }) {
  if (snapshot.buyNowPrice === null) return null;
  return (
    <button
      type="button"
      className="w-full rounded-xl border-2 border-amber-500 px-4 py-3 font-semibold text-amber-700 hover:bg-amber-50"
    >
      {t('buyNow.button', { price: formatPrice(snapshot.buyNowPrice, snapshot.currency) })}
    </button>
  );
}
