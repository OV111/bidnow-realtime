import { useParams } from 'react-router-dom';

import type { AuctionSnapshot } from '@shared/types';

import LiveBoard from '@/features/auctions/live/LiveBoard';
import LiveFrame from '@/features/auctions/live/LiveFrame';
import SoldScreen from '@/features/auctions/live/SoldScreen';
import StartingSoon from '@/features/auctions/live/StartingSoon';
import useLiveAuction from '@/features/auctions/useLiveAuction';
import { t } from '@/i18n';

function LiveMessage({ text }: { text: string }) {
  return (
    <LiveFrame centered>
      <p className="text-[8vmin] font-bold">{text}</p>
    </LiveFrame>
  );
}

interface LiveViewProps {
  auction: AuctionSnapshot;
  clockOffsetMs: number;
  extendedAt: number | null;
}

function LiveView({ auction, clockOffsetMs, extendedAt }: LiveViewProps) {
  if (auction.status === 'ENDED') return <SoldScreen auction={auction} />;
  if (auction.status === 'SCHEDULED') return <StartingSoon auction={auction} clockOffsetMs={clockOffsetMs} />;
  return <LiveBoard auction={auction} clockOffsetMs={clockOffsetMs} extendedAt={extendedAt} />;
}

function LivePage() {
  const { id = '' } = useParams();
  const { phase, auction, clockOffsetMs, connected, extendedAt } = useLiveAuction(id);

  if (phase === 'loading') return <LiveMessage text={t('state.loading')} />;
  if (phase === 'error' && !auction) return <LiveMessage text={t('state.error.title')} />;
  if (phase === 'not_found' || !auction) return <LiveMessage text={t('state.notFound.title')} />;

  return (
    <>
      <LiveView auction={auction} clockOffsetMs={clockOffsetMs} extendedAt={extendedAt} />
      {!connected && (
        <p className="fixed right-[2vmin] bottom-[2vmin] z-10 animate-pulse rounded-full bg-amber-500 px-[2vmin] py-[0.8vmin] text-[2.2vmin] font-semibold text-black">
          {t('live.reconnecting')}
        </p>
      )}
    </>
  );
}

export default LivePage;
