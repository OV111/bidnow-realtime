import { useState, type FormEvent } from 'react';
import type { AuctionSnapshot } from '@shared/types';
import type { BidOutcome } from '../../../hooks/useLiveAuction';
import { t } from '../../../i18n';
import { centsToInput, formatPrice, parseAmountToCents } from '../../../lib/money';
import { bidErrorKey, nextMinBid } from '../helpers';

interface Props {
  snapshot: AuctionSnapshot;
  onBid: (amount: number) => Promise<BidOutcome>;
  disabled?: boolean;
}

type Message = { kind: 'success' | 'error'; text: string };

export function BidBox({ snapshot, onBid, disabled = false }: Props) {
  const minBid = nextMinBid(snapshot);
  const { currency } = snapshot;
  const [value, setValue] = useState(centsToInput(minBid));
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  const [prevMin, setPrevMin] = useState(minBid);
  if (minBid !== prevMin) {
    setPrevMin(minBid);
    const typed = parseAmountToCents(value);
    if (typed === null || typed < minBid) setValue(centsToInput(minBid));
  }

  async function submit(amount: number) {
    setPending(true);
    setMessage(null);
    const res = await onBid(amount);
    setPending(false);
    if (res.ok) {
      setMessage({ kind: 'success', text: t('bid.success', { price: formatPrice(res.data.amount, currency) }) });
    } else {
      setMessage({
        kind: 'error',
        text: t(bidErrorKey(res.error, snapshot.status), { price: formatPrice(minBid, currency) }),
      });
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const amount = parseAmountToCents(value);
    if (amount === null || amount <= 0) {
      setMessage({ kind: 'error', text: t('bid.invalid') });
      return;
    }
    void submit(amount);
  }

  const locked = disabled || pending;
  const quickBids = [minBid + snapshot.minIncrement, minBid + snapshot.minIncrement * 3];

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
          disabled={locked}
          onChange={(e) => setValue(e.target.value)}
          className="w-full flex-1 rounded-xl border border-slate-300 px-3 py-3 text-lg tabular-nums focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100"
        />
        <button
          type="submit"
          disabled={locked}
          className="shrink-0 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? t('bid.submitting') : t('bid.submit')}
        </button>
      </div>
      <p className="text-xs text-slate-500">{t('bid.min', { price: formatPrice(minBid, currency) })}</p>

      <button
        type="button"
        disabled={locked}
        onClick={() => void submit(minBid)}
        className="w-full rounded-xl bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {t('bid.quickPlace', { price: formatPrice(minBid, currency) })}
      </button>

      <div className="flex flex-wrap gap-2">
        {quickBids.map((amount) => (
          <button
            key={amount}
            type="button"
            disabled={locked}
            onClick={() => setValue(centsToInput(amount))}
            className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-indigo-400 hover:text-indigo-700 disabled:opacity-50"
          >
            {t('bid.quick', { price: formatPrice(amount, currency) })}
          </button>
        ))}
      </div>

      {message && (
        <p
          role={message.kind === 'error' ? 'alert' : 'status'}
          className={`rounded-lg px-3 py-2 text-sm ${
            message.kind === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {message.text}
        </p>
      )}
    </form>
  );
}
