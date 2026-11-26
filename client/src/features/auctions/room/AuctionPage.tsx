import { useParams, useSearchParams } from 'react-router-dom';

import ErrorState from '@/components/ErrorState';
import NotFound from '@/components/NotFound';
import Spinner from '@/components/Spinner';
import AuctionDetails from '@/features/auctions/room/AuctionDetails';
import BidHistory from '@/features/auctions/room/BidHistory';
import BidPanel from '@/features/auctions/room/BidPanel';
import PriceBoard from '@/features/auctions/room/PriceBoard';
import useLiveAuction from '@/features/auctions/useLiveAuction';
import { t } from '@/i18n';
import { getToken, getUserIdFromToken } from '@/lib/token';

function AuctionPage() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const token = params.get('guest') ? null : getToken();
  const userId = getUserIdFromToken(token);
  const { phase, auction, connected, sessionExpired, clockOffsetMs, placeBid, buyNow } = useLiveAuction(id, token);
  const isGuest = !userId || sessionExpired;

  if (phase === 'loading') return <Spinner label={t('state.loading')} />;
  if (phase === 'error') return <ErrorState body={t('state.error.body')} onRetry={() => window.location.reload()} />;
  if (phase === 'not_found' || !auction) return <NotFound title={t('state.notFound.title')} body={t('state.notFound.body')} />;

  return (
    <div className="mx-auto grid max-w-6xl gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:grid-rows-[auto_1fr] lg:gap-6 lg:p-6">
      <div className="lg:col-start-1 lg:row-start-1">
        <AuctionDetails auction={auction} />
      </div>

      <aside className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <div className="space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 lg:sticky lg:top-20">
          {!connected && (
            <p className="rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-800">{t('state.reconnecting.banner')}</p>
          )}

          {sessionExpired && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-200">
              <p className="font-semibold">{t('session.expired.title')}</p>
              <p>{t('session.expired.body')}</p>
            </div>
          )}

          <PriceBoard auction={auction} userId={userId} clockOffsetMs={clockOffsetMs} />

          <BidPanel
            auction={auction}
            userId={userId}
            isGuest={isGuest}
            connected={connected}
            onBid={placeBid}
            onBuyNow={buyNow}
          />
        </div>
      </aside>

      <div className="lg:col-start-1 lg:row-start-2">
        <BidHistory bids={auction.bids} currency={auction.currency} userId={userId} />
      </div>
    </div>
  );
}

export default AuctionPage;
