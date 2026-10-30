import { Link, useParams, useSearchParams } from 'react-router-dom';
import { EmptyState, Spinner } from '../components/PageState';
import { StatusBadge } from '../components/StatusBadge';
import { getStanding } from '../features/auction/helpers';
import { BidBox } from '../features/auction/components/BidBox';
import { BidHistory } from '../features/auction/components/BidHistory';
import { BuyNowButton } from '../features/auction/components/BuyNowButton';
import { Countdown } from '../features/auction/components/Countdown';
import { GuestBidPrompt } from '../features/auction/components/GuestBidPrompt';
import { ItemInfo } from '../features/auction/components/ItemInfo';
import { PriceLeader } from '../features/auction/components/PriceLeader';
import { StandingIndicator } from '../features/auction/components/StandingIndicator';
import { ViewersCount } from '../features/auction/components/ViewersCount';
import { WinnerBanner } from '../features/auction/components/WinnerBanner';
import { useLiveAuction } from '../hooks/useLiveAuction';
import { t } from '../i18n';
import { getToken, getUserId } from '../lib/auth';

export default function AuctionPage() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const token = params.get('guest') ? null : getToken();
  const userId = getUserId(token);
  const { phase, auction: snapshot, connected, placeBid } = useLiveAuction(id, token);

  if (phase === 'loading') return <Spinner label={t('state.loading')} />;

  if (phase === 'not_found' || !snapshot) {
    return (
      <EmptyState
        title={t('state.notFound.title')}
        body={t('state.notFound.body')}
        action={
          <Link to="/auctions" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
            {t('state.notFound.back')}
          </Link>
        }
      />
    );
  }

  const live = snapshot.status === 'LIVE';
  const isSeller = userId === snapshot.sellerId;

  return (
    <div className="mx-auto grid max-w-6xl gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:grid-rows-[auto_1fr] lg:gap-6 lg:p-6">
      <div className="lg:col-start-1 lg:row-start-1">
        <ItemInfo snapshot={snapshot} />
      </div>

      <aside className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <div className="space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 lg:sticky lg:top-20">
          {!connected && (
            <p className="rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-800">{t('state.reconnecting.banner')}</p>
          )}
          <div className="flex items-center justify-between">
            <StatusBadge status={snapshot.status} />
            <ViewersCount count={snapshot.viewers} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <PriceLeader snapshot={snapshot} userId={userId} />
            <Countdown snapshot={snapshot} />
          </div>
          {snapshot.status === 'ENDED' && <WinnerBanner snapshot={snapshot} userId={userId} />}
          {live && <StandingIndicator standing={getStanding(snapshot, userId)} />}
          {live && isSeller && <p className="text-sm text-slate-500">{t('bid.sellerNotice')}</p>}
          {live && !isSeller && <BidBox snapshot={snapshot} onBid={placeBid} disabled={!userId || !connected} />}
          {live && !userId && <GuestBidPrompt />}
          {live && userId && !isSeller && <BuyNowButton snapshot={snapshot} />}
        </div>
      </aside>

      <div className="lg:col-start-1 lg:row-start-2">
        <BidHistory bids={snapshot.bids} currency={snapshot.currency} userId={userId} />
      </div>
    </div>
  );
}
