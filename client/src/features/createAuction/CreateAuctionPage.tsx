import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateAuctionForm } from './components/CreateAuctionForm';
import type { CreateAuctionPayload } from './helpers';
import { t, type MessageKey } from '../../i18n';
import { createAuction, type CreateAuctionError } from '../../lib/api';
import { getToken, getUserId } from '../../lib/auth';

const errorKeys: Record<CreateAuctionError, MessageKey> = {
  no_server: 'create.fail.noServer',
  unauthorized: 'create.fail.unauthorized',
  invalid: 'create.fail.invalid',
  rate_limited: 'create.fail.rateLimited',
  network: 'create.fail.network',
  server: 'create.fail.server',
};

export default function CreateAuctionPage() {
  const navigate = useNavigate();
  const token = getToken();
  const loggedIn = getUserId(token) !== null;
  const [failure, setFailure] = useState<CreateAuctionError | null>(null);

  async function handleSubmit(payload: CreateAuctionPayload) {
    setFailure(null);
    const result = await createAuction(payload, token ?? '');
    if (result.ok) {
      navigate(`/auctions/${result.id}`);
    } else {
      setFailure(result.error);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 lg:px-6">
      <h1 className="mb-6 text-2xl font-extrabold">{t('create.title')}</h1>
      {!loggedIn && (
        <p role="status" className="mb-4 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-800">
          {t('create.loginRequired')}
        </p>
      )}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        {failure && (
          <p role="alert" className="mb-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {t(errorKeys[failure])}
          </p>
        )}
        <CreateAuctionForm onSubmit={handleSubmit} disabled={!loggedIn} />
      </div>
    </div>
  );
}
