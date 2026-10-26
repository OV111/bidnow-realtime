import { t } from '../../../i18n';

export function ViewersCount({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
        <path d="M10 4C5 4 1.7 8.2 1 10c.7 1.8 4 6 9 6s8.3-4.2 9-6c-.7-1.8-4-6-9-6Zm0 10a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-6a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
      </svg>
      {t('viewers.count', { count })}
    </span>
  );
}
