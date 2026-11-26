import { useState, type SubmitEvent } from 'react';

import type { AuctionSnapshot } from '@shared/types';

import type { BidOutcome } from '@/features/auctions/useLiveAuction';
import { t } from '@/i18n';
import { toPriceInput, formatPrice, parsePrice } from '@/lib/price';

interface Props {
  auction: AuctionSnapshot;
  onBid: (amount: number) => Promise<BidOutcome>;
  disabled?: boolean;
}

interface Message {
  kind: 'success' | 'error';
  text: string;
}

function BidForm({ auction, onBid, disabled = false }: Props) {
  const { currency, minIncrement } = auction;
  const minBid = auction.leaderId ? auction.currentPrice + minIncrement : auction.startPrice;

  const [value, setValue] = useState(toPriceInput(minBid));
  const [lastMinBid, setLastMinBid] = useState(minBid);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  if (minBid !== lastMinBid) {
    setLastMinBid(minBid);
    const typed = parsePrice(value);
    if (typed === null || typed < minBid) setValue(toPriceInput(minBid));
  }

  async function submit(amount: number) {
    setPending(true);
    setMessage(null);
    const result = await onBid(amount);
    setPending(false);

    if (result.ok) {
      const price = formatPrice(result.data.amount, currency);
      setMessage({ kind: 'success', text: t('bid.success', { price }) });
    } else {
      const price = formatPrice(minBid, currency);
      setMessage({ kind: 'error', text: t(`bid.error.${result.error}`, { price }) });
    }
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = parsePrice(value);
    if (amount === null || amount <= 0) {
      setMessage({ kind: 'error', text: t('bid.invalid') });
      return;
    }
    submit(amount);
  }

  const isDisabled = disabled || pending;
  const quickBids = [minBid + minIncrement, minBid + minIncrement * 3];

  return (
    <form onSubmit={handleSubmit} className="space-y-3" aria-busy={pending}>
      <label htmlFor="bid-amount" className="block text-sm font-medium text-slate-700">
        {t('bid.label')}
      </label>
      <div className="flex gap-2">
        <input
          id="bid-amount"
          inputMode="decimal"
          value={value}
          disabled={isDisabled}
          onChange={(event) => setValue(event.target.value)}
          className="w-full flex-1 rounded-xl border border-slate-300 px-3 py-3 text-lg tabular-nums focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100"
        />
        <button
          type="submit"
          disabled={isDisabled}
          className="shrink-0 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? t('bid.submitting') : t('bid.submit')}
        </button>
      </div>
      <p className="text-xs text-slate-500">{t('bid.min', { price: formatPrice(minBid, currency) })}</p>

      <button
        type="button"
        disabled={isDisabled}
        onClick={() => submit(minBid)}
        className="w-full rounded-xl bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {t('bid.quickPlace', { price: formatPrice(minBid, currency) })}
      </button>

      <div className="flex flex-wrap gap-2">
        {quickBids.map((amount) => (
          <button
            key={amount}
            type="button"
            disabled={isDisabled}
            onClick={() => setValue(toPriceInput(amount))}
            className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-indigo-400 hover:text-indigo-700 disabled:opacity-50"
          >
            {t('bid.quick', { price: formatPrice(amount, currency) })}
          </button>
        ))}
      </div>

      {message?.kind === 'success' && (
        <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message.text}
        </p>
      )}

      {message?.kind === 'error' && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {message.text}
        </p>
      )}
    </form>
  );
}

export default BidForm;
