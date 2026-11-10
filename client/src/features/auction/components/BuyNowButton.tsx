import { useState } from 'react';
import type { AuctionSnapshot } from '@shared/types';
import type { BuyNowOutcome } from '../hooks/useLiveAuction';
import { t } from '../../../i18n';
import { formatPrice } from '../../../lib/money';
import { buyNowErrorKey } from '../helpers';

interface Props {
  snapshot: AuctionSnapshot;
  onBuyNow: () => Promise<BuyNowOutcome>;
  disabled?: boolean;
}

type Step = 'idle' | 'confirm' | 'pending';

export function BuyNowButton({ snapshot, onBuyNow, disabled = false }: Props) {
  const [step, setStep] = useState<Step>('idle');
  const [error, setError] = useState<string | null>(null);

  if (snapshot.buyNowPrice === null) return null;
  const price = formatPrice(snapshot.buyNowPrice, snapshot.currency);

  async function confirm() {
    setStep('pending');
    setError(null);
    const res = await onBuyNow();
    setStep('idle');
    // On success nothing to do here: the auction:ended broadcast switches
    // the page to the winner banner and this button disappears.
    if (!res.ok) setError(t(buyNowErrorKey(res.error, snapshot.status)));
  }

  return (
    <div className="space-y-2">
      {step === 'idle' ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setError(null);
            setStep('confirm');
          }}
          className="w-full rounded-xl border-2 border-amber-500 px-4 py-3 font-semibold text-amber-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t('buyNow.button', { price })}
        </button>
      ) : (
        <div className="space-y-3 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200" aria-busy={step === 'pending'}>
          <p className="text-sm text-amber-900">{t('buyNow.confirm', { price })}</p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={step === 'pending' || disabled}
              onClick={() => void confirm()}
              className="flex-1 rounded-lg bg-amber-500 px-3 py-2 font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
            >
              {step === 'pending' ? t('buyNow.pending') : t('buyNow.confirmYes')}
            </button>
            <button
              type="button"
              disabled={step === 'pending'}
              onClick={() => setStep('idle')}
              className="rounded-lg px-3 py-2 font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              {t('buyNow.cancel')}
            </button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
