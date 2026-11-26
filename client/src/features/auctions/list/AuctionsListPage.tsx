import { useSearchParams } from 'react-router-dom';

import type { AuctionStatus } from '@shared/types';

import AuctionGrid from '@/features/auctions/list/AuctionGrid';
import { t, type MessageKey } from '@/i18n';

interface Filter {
  key: string;
  label: MessageKey;
  status?: AuctionStatus;
}

const filters: Filter[] = [
  { key: 'live', label: 'list.filter.live', status: 'LIVE' },
  { key: 'upcoming', label: 'list.filter.upcoming', status: 'SCHEDULED' },
  { key: 'all', label: 'list.filter.all' },
];

function AuctionsListPage() {
  const [params, setParams] = useSearchParams();
  const active = filters.find((filter) => filter.key === params.get('filter')) ?? filters[0];

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 lg:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{t('list.title')}</h1>

        <div className="inline-flex rounded-xl bg-slate-100 p-1">
          {filters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setParams({ filter: filter.key })}
              className={`flex-1 rounded-lg px-4 py-1.5 text-sm font-medium sm:flex-none ${
                active.key === filter.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              {t(filter.label)}
            </button>
          ))}
        </div>
      </div>

      <AuctionGrid key={active.key} status={active.status} />
    </div>
  );
}

export default AuctionsListPage;
