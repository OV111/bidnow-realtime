import type { AuctionSnapshot } from '@shared/types';
import { t } from '../../../i18n';
import { formatCountdown } from '../../../lib/time';
import { useNow } from '../../../lib/useNow';

export function Countdown({ snapshot, offsetMs = 0 }: { snapshot: AuctionSnapshot; offsetMs?: number }) {
  // offsetMs = server clock minus device clock, so the countdown follows the server's view of "now".
  const now = useNow() + offsetMs;

  if (snapshot.status === 'ENDED') {
    return <p className="text-lg font-semibold text-slate-500">{t('timer.ended')}</p>;
  }

  const upcoming = snapshot.status === 'SCHEDULED' && snapshot.startsAt;
  const target = new Date(upcoming ? snapshot.startsAt! : snapshot.endsAt).getTime();
  const remaining = Math.max(0, target - now);

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {upcoming ? t('timer.startsIn') : t('timer.endsIn')}
      </p>
      <p
        className={`text-2xl font-bold tabular-nums sm:text-3xl ${
          snapshot.status === 'LIVE' && remaining <= 60_000 ? 'text-red-600' : 'text-slate-900'
        }`}
      >
        {formatCountdown(remaining)}
      </p>
    </div>
  );
}
