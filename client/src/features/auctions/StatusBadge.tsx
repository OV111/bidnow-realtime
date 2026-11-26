import type { AuctionStatus } from '@shared/types';

import { t } from '@/i18n';

const statusColors = {
  LIVE: 'bg-red-600 text-white',
  SCHEDULED: 'bg-amber-100 text-amber-800',
  ENDED: 'bg-slate-200 text-slate-700',
};

function StatusBadge({ status }: { status: AuctionStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${statusColors[status]}`}
    >
      {status === 'LIVE' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" aria-hidden />}
      {t(`status.${status}`)}
    </span>
  );
}

export default StatusBadge;
