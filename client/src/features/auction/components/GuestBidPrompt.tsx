import { t } from '../../../i18n';

export function GuestBidPrompt() {
  return (
    <div className="space-y-3 rounded-xl bg-slate-50 p-4 text-center ring-1 ring-slate-200">
      <p className="text-sm font-medium text-slate-700">{t('guest.title')}</p>
      <button type="button" className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-500">
        {t('guest.cta')}
      </button>
    </div>
  );
}
