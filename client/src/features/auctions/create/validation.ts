import { createAuctionBody, MAX_PRICE_CENTS, type CreateAuctionBody, type CreateAuctionErrorCode } from '@shared/createAuction';

import { parsePrice } from '@/lib/price';

export type FormErrors = Record<string, CreateAuctionErrorCode>;

type ValidateResult = { ok: true; payload: CreateAuctionBody } | { ok: false; errors: FormErrors };

export function cleanPriceInput(raw: string, prev: string): string {
  let price = raw.replace(/,/g, '.').replace(/[^\d.]/g, '');
  const dot = price.indexOf('.');
  if (dot !== -1) price = price.slice(0, dot + 1) + price.slice(dot + 1).replace(/\./g, '').slice(0, 2);
  if (price.startsWith('.')) price = `0${price}`;
  const cents = parsePrice(price);
  return cents !== null && cents > MAX_PRICE_CENTS ? prev : price;
}

function toIso(local: string) {
  return local ? new Date(local).toISOString() : undefined;
}

export function validate(form: FormData): ValidateResult {
  const value = (name: string) => String(form.get(name) ?? '');
  const buyNowPrice = value('buyNowPrice');

  const result = createAuctionBody.safeParse({
    title: value('title'),
    description: value('description').trim() || null,
    photoUrl: value('photoUrl').trim(),
    startPrice: parsePrice(value('startPrice')) ?? undefined,
    minIncrement: parsePrice(value('minIncrement')) ?? undefined,
    buyNowPrice: buyNowPrice ? (parsePrice(buyNowPrice) ?? Number.NaN) : null,
    startsAt: toIso(value('startsAt')) ?? null,
    endsAt: toIso(value('endsAt')),
  });

  if (result.success) {
    return { ok: true, payload: result.data };
  }

  const errors: FormErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (typeof field === 'string') {
      errors[field] ??= issue.message as CreateAuctionErrorCode;
    }
  }
  return { ok: false, errors };
}
