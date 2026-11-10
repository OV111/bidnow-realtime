import { useSearchParams } from 'react-router-dom';
import type { AuctionStatus } from '@shared/types';
import { EmptyState, Spinner } from '../../components/PageState';
import { t, type MessageKey } from '../../i18n';
import { AuctionCard } from './components/AuctionCard';
import { useAuctionList } from './hooks/useAuctionList';

const filters: { key: string; label: MessageKey; status?: AuctionStatus }[] = [
  { key: 'live', label: 'list.filter.live', status: 'LIVE' },
  { key: 'upcoming', label: 'list.filter.upcoming', status: 'SCHEDULED' },
  { key: 'all', label: 'list.filter.all' },
];

export default function AuctionsListPage() {
  const [params, setParams] = useSearchParams();
  const active = filters.find((f) => f.key === params.get('filter')) ?? filters[0];
  const { phase, auctions, retry } = useAuctionList(active.status);

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 lg:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{t('list.title')}</h1>
        <div className="inline-flex rounded-xl bg-slate-100 p-1">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setParams({ filter: f.key })}
              className={`flex-1 rounded-lg px-4 py-1.5 text-sm font-medium sm:flex-none ${
                active.key === f.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              {t(f.label)}
            </button>
          ))}
        </div>
      </div>

      {phase === 'loading' && <Spinner label={t('list.loading')} />}

      {phase === 'error' && (
        <EmptyState
          title={t('state.error.title')}
          body={t('list.error.body')}
          action={
            <button
              type="button"
              onClick={retry}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              {t('state.error.retry')}
            </button>
          }
        />
      )}

      {phase === 'ready' &&
        (auctions.length === 0 ? (
          <EmptyState title={t('list.empty')} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {auctions.map((a) => (
              <AuctionCard key={a.id} auction={a} />
            ))}
          </div>
        ))}
    </div>
  );
}
