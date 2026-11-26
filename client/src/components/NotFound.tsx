import { Link } from 'react-router-dom';

import EmptyState from '@/components/EmptyState';
import { t } from '@/i18n';

interface Props {
  title?: string;
  body?: string;
}

function NotFound({ title = t('page.notFound.title'), body = t('page.notFound.body') }: Props) {
  return (
    <EmptyState
      title={title}
      body={body}
      action={
        <Link to="/auctions" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
          {t('state.notFound.back')}
        </Link>
      }
    />
  );
}

export default NotFound;
