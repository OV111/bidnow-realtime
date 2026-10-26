import type { AuctionSnapshot } from '@shared/events';
import { t } from '../../../i18n';
import { formatPrice } from '../../../lib/money';

export function WinnerBanner({ snapshot, userId }: { snapshot: AuctionSnapshot; userId: string | null }) {
  const { winner } = snapshot;

  if (!winner) {
    return <div className="rounded-xl bg-slate-100 p-4 text-center font-semibold text-slate-700">{t('winner.none')}</div>;
  }

  const price = formatPrice(winner.finalPrice, snapshot.currency);
  const isMe = winner.userId === userId;

  return (
    <div className={`rounded-xl p-4 text-center text-white ${isMe ? 'bg-emerald-600' : 'bg-slate-900'}`}>
      <p className="text-lg font-bold">
        {isMe ? t('winner.you', { price }) : t('winner.other', { name: winner.userName, price })}
      </p>
      {winner.viaBuyNow && <p className="mt-1 text-sm opacity-80">{t('winner.buyNow')}</p>}
    </div>
  );
}
