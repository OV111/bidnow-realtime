import type { AuctionSnapshot } from '@shared/types';

import BidForm from '@/features/auctions/room/BidForm';
import BuyNowButton from '@/features/auctions/room/BuyNowButton';
import type { BidOutcome, BuyNowOutcome } from '@/features/auctions/useLiveAuction';
import { t } from '@/i18n';
import { formatPrice } from '@/lib/price';

interface Props {
  auction: AuctionSnapshot;
  userId: string | null;
  isGuest: boolean;
  connected: boolean;
  onBid: (amount: number) => Promise<BidOutcome>;
  onBuyNow: () => Promise<BuyNowOutcome>;
}

function BidPanel({ auction, userId, isGuest, connected, onBid, onBuyNow }: Props) {
  const { winner } = auction;

  if (auction.status === 'SCHEDULED') return null;

  if (auction.status === 'ENDED') {
    if (!winner) {
      return (
        <p className="rounded-xl bg-slate-100 p-4 text-center font-semibold text-slate-700">
          {t('winner.none')}
        </p>
      );
    }

    const price = formatPrice(winner.finalPrice, auction.currency);
    const isMe = winner.userId === userId;

    return (
      <div className={`rounded-xl p-4 text-center text-white ${isMe ? 'bg-emerald-600' : 'bg-slate-900'}`}>
        <p className="text-lg font-bold">
          {isMe ? t('winner.you', { price }) : t('winner.other', { name: winner.userName, price })}
        </p>
        {winner.reason === 'buy_now' && <p className="mt-1 text-sm opacity-80">{t('winner.buyNow')}</p>}
      </div>
    );
  }

  if (userId === auction.sellerId) {
    return <p className="text-sm text-slate-500">{t('bid.sellerNotice')}</p>;
  }

  const isLeading = userId !== null && auction.leaderId === userId;
  const wasOutbid = !isLeading && auction.bids.some((bid) => bid.userId === userId);

  return (
    <>
      {isLeading && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200">
          {t('standing.winning')}
        </p>
      )}

      {wasOutbid && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-800 ring-1 ring-red-200">
          {t('standing.outbid')}
        </p>
      )}

      <BidForm auction={auction} onBid={onBid} disabled={isGuest || !connected} />

      {isGuest && (
        <div className="space-y-3 rounded-xl bg-slate-50 p-4 text-center ring-1 ring-slate-200">
          <p className="text-sm font-medium text-slate-700">{t('guest.title')}</p>
          <button type="button" className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-500">
            {t('guest.cta')}
          </button>
        </div>
      )}

      {!isGuest && auction.buyNowPrice !== null && (
        <BuyNowButton
          price={formatPrice(auction.buyNowPrice, auction.currency)}
          onBuyNow={onBuyNow}
          disabled={!connected}
        />
      )}
    </>
  );
}

export default BidPanel;
