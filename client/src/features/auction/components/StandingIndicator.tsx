import { t } from '../../../i18n';
import type { Standing } from '../helpers';

export function StandingIndicator({ standing }: { standing: Standing }) {
  if (standing === 'none') return null;
  const winning = standing === 'winning';
  return (
    <div
      className={`rounded-lg px-3 py-2 text-sm font-semibold ${
        winning ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200' : 'bg-red-50 text-red-800 ring-1 ring-red-200'
      }`}
    >
      {winning ? t('standing.winning') : t('standing.outbid')}
    </div>
  );
}
