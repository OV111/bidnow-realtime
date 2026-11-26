import EmptyState from '@/components/EmptyState';
import { t } from '@/i18n';

interface Props {
  body: string;
  onRetry: () => void;
}

function ErrorState({ body, onRetry }: Props) {
  return (
    <EmptyState
      title={t('state.error.title')}
      body={body}
      action={
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          {t('state.error.retry')}
        </button>
      }
    />
  );
}

export default ErrorState;
