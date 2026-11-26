import type { AuctionSnapshot } from '@shared/types';

import LiveFrame from '@/features/auctions/live/LiveFrame';
import { t } from '@/i18n';
import { formatPrice } from '@/lib/price';

function SoldScreen({ auction }: { auction: AuctionSnapshot }) {
  const { winner } = auction;

  return (
    <LiveFrame centered>
      <p className="text-[4vmin] text-zinc-400">{auction.title}</p>
      {winner ? (
        <>
          <p className="text-[16vmin] leading-none font-black text-emerald-400">{t('live.sold')}</p>
          <p className="text-[12vmin] leading-none font-bold tabular-nums">
            {formatPrice(winner.finalPrice, auction.currency)}
          </p>
          <p className="text-[6vmin]">{t('live.soldTo', { name: winner.userName })}</p>
          {winner.reason === 'buy_now' && <p className="text-[3vmin] text-zinc-400">{t('live.viaBuyNow')}</p>}
        </>
      ) : (
        <p className="text-[14vmin] leading-none font-black text-zinc-500">{t('live.noBids')}</p>
      )}
    </LiveFrame>
  );
}

export default SoldScreen;
