import { useSearchParams } from 'react-router-dom';
import { EmptyState } from '../components/PageState';
import { AuctionCard } from '../features/auctions/AuctionCard';
import { t, type MessageKey } from '../i18n';
import { summaries } from '../mock/auctions';

const filters: { key: string; label: MessageKey; status?: string }[] = [
  { key: 'live', label: 'list.filter.live', status: 'LIVE' },
  { key: 'upcoming', label: 'list.filter.upcoming', status: 'UPCOMING' },
  { key: 'all', label: 'list.filter.all' },
];

export default function AuctionsListPage() {
  const [params, setParams] = useSearchParams();
  const active = filters.find((f) => f.key === params.get('filter')) ?? filters[0];
  const list = summaries.filter((a) => !active.status || a.status === active.status);

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

      {list.length === 0 ? (
        <EmptyState title={t('list.empty')} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((a) => (
            <AuctionCard key={a.id} auction={a} />
          ))}
        </div>
      )}
    </div>
  );
}
