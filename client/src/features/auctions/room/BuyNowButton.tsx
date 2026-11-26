import { useState } from 'react';

import type { BuyNowOutcome } from '@/features/auctions/useLiveAuction';
import { t } from '@/i18n';

interface Props {
  price: string;
  onBuyNow: () => Promise<BuyNowOutcome>;
  disabled?: boolean;
}

function BuyNowButton({ price, onBuyNow, disabled = false }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setPending(true);
    setError(null);
    const result = await onBuyNow();
    setPending(false);
    setConfirming(false);
    if (!result.ok) setError(t(`buyNow.error.${result.error}`));
  }

  function open() {
    setError(null);
    setConfirming(true);
  }

  return (
    <div className="space-y-2">
      {confirming ? (
        <div className="space-y-3 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200" aria-busy={pending}>
          <p className="text-sm text-amber-900">{t('buyNow.confirm', { price })}</p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending || disabled}
              onClick={confirm}
              className="flex-1 rounded-lg bg-amber-500 px-3 py-2 font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
            >
              {pending ? t('buyNow.pending') : t('buyNow.confirmYes')}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirming(false)}
              className="rounded-lg px-3 py-2 font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              {t('buyNow.cancel')}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={open}
          className="w-full rounded-xl border-2 border-amber-500 px-4 py-3 font-semibold text-amber-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t('buyNow.button', { price })}
        </button>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export default BuyNowButton;
