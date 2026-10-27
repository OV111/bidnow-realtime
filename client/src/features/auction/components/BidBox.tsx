import { useState } from 'react';
import type { AuctionSnapshot } from '@shared/types';
import { t } from '../../../i18n';
import { centsToInput, formatPrice } from '../../../lib/money';
import { nextMinBid } from '../helpers';

export function BidBox({ snapshot }: { snapshot: AuctionSnapshot }) {
  const minBid = nextMinBid(snapshot);
  const [value, setValue] = useState(centsToInput(minBid));
  const quickBids = [minBid, minBid + snapshot.minIncrement, minBid + snapshot.minIncrement * 3];

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-3">
      <label htmlFor="bid-amount" className="block text-sm font-medium text-slate-700">
        {t('bid.label')}
      </label>
      <div className="flex gap-2">
        <input
          id="bid-amount"
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full flex-1 rounded-xl border border-slate-300 px-3 py-3 text-lg tabular-nums focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
        <button type="submit" className="shrink-0 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-500">
          {t('bid.submit')}
        </button>
      </div>
      <p className="text-xs text-slate-500">{t('bid.min', { price: formatPrice(minBid, snapshot.currency) })}</p>
      <div className="flex flex-wrap gap-2">
        {quickBids.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => setValue(centsToInput(amount))}
            className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-indigo-400 hover:text-indigo-700"
          >
            {t('bid.quick', { price: formatPrice(amount, snapshot.currency) })}
          </button>
        ))}
      </div>
    </form>
  );
}
