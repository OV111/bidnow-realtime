import type { AuctionStatus } from '@shared/events';
import { t } from '../i18n';

const styles: Record<AuctionStatus, string> = {
  LIVE: 'bg-red-600 text-white',
  UPCOMING: 'bg-amber-100 text-amber-800',
  ENDED: 'bg-slate-200 text-slate-700',
};

export function StatusBadge({ status }: { status: AuctionStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${styles[status]}`}
    >
      {status === 'LIVE' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" aria-hidden />}
      {t(`status.${status}`)}
    </span>
  );
}
