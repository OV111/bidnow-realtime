import type { AuctionStatus } from '@shared/types';

import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import Spinner from '@/components/Spinner';
import AuctionCard from '@/features/auctions/list/AuctionCard';
import useAuctionList from '@/features/auctions/list/useAuctionList';
import { t } from '@/i18n';

function AuctionGrid({ status }: { status?: AuctionStatus }) {
  const { phase, auctions, retry } = useAuctionList(status);

  if (phase === 'loading') return <Spinner label={t('list.loading')} />;
  if (phase === 'error') return <ErrorState body={t('list.error.body')} onRetry={retry} />;
  if (auctions.length === 0) return <EmptyState title={t('list.empty')} />;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {auctions.map((auction) => (
        <AuctionCard key={auction.id} auction={auction} />
      ))}
    </div>
  );
}

export default AuctionGrid;
