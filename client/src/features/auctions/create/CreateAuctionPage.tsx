import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { CreateAuctionBody } from '@shared/createAuction';

import { createAuction, type CreateAuctionError } from '@/features/auctions/api';
import CreateAuctionForm from '@/features/auctions/create/CreateAuctionForm';
import { t } from '@/i18n';
import { getToken, getUserIdFromToken } from '@/lib/token';

function CreateAuctionPage() {
  const navigate = useNavigate();
  const token = getToken();
  const loggedIn = getUserIdFromToken(token) !== null;
  const [failure, setFailure] = useState<CreateAuctionError | null>(null);

  async function handleSubmit(payload: CreateAuctionBody) {
    setFailure(null);
    const result = await createAuction(payload, token ?? '');
    if (result.ok) {
      navigate(`/auctions/${result.data}`);
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
            {t(`create.fail.${failure}`)}
          </p>
        )}
        <CreateAuctionForm onSubmit={handleSubmit} disabled={!loggedIn} />
      </div>
    </div>
  );
}

export default CreateAuctionPage;
