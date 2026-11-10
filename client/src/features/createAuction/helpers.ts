import { createAuctionBody, MAX_PRICE_CENTS, type CreateAuctionBody, type CreateAuctionErrorCode } from '@shared/createAuction';
import { parseAmountToCents } from '../../lib/money';

export interface CreateAuctionValues {
  title: string;
  description: string;
  photoUrl: string;
  startPrice: string;
  minIncrement: string;
  buyNowPrice: string;
  startsAt: string;
  endsAt: string;
}
export const emptyValues: CreateAuctionValues = {
  title: '',
  description: '',
  photoUrl: '',
  startPrice: '',
  minIncrement: '',
  buyNowPrice: '',
  startsAt: '',
  endsAt: '',
};

const toIso = (local: string) => (local ? new Date(local).toISOString() : undefined);
export type FormErrors = Partial<Record<keyof CreateAuctionValues, CreateAuctionErrorCode>>;
export function sanitizePrice(raw: string, prev: string): string {
  // handling (, . ) as .
  let v = raw.replace(/,/g, '.').replace(/[^\d.]/g, '');
  const dot = v.indexOf('.');
  if (dot !== -1) v = v.slice(0, dot + 1) + v.slice(dot + 1).replace(/\./g, '').slice(0, 2);
  if (v.startsWith('.')) v = `0${v}`;
  const cents = parseAmountToCents(v);
  return cents !== null && cents > MAX_PRICE_CENTS ? prev : v;
}

export type CreateAuctionPayload = CreateAuctionBody;

export function validate(v: CreateAuctionValues): { ok: true; payload: CreateAuctionPayload } | { ok: false; errors: FormErrors } {
  const result = createAuctionBody.safeParse({
    title: v.title,
    description: v.description.trim() || null,
    photoUrl: v.photoUrl.trim(),
    startPrice: parseAmountToCents(v.startPrice) ?? undefined,
    minIncrement: parseAmountToCents(v.minIncrement) ?? undefined,
    buyNowPrice: v.buyNowPrice ? (parseAmountToCents(v.buyNowPrice) ?? Number.NaN) : null,
    startsAt: toIso(v.startsAt) ?? null,
    endsAt: toIso(v.endsAt),
  });

  if (result.success) {
    return { ok: true, payload: result.data };
  }
  const errors: FormErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (typeof field === 'string' && field in emptyValues) {
      errors[field as keyof CreateAuctionValues] ??= issue.message as CreateAuctionErrorCode;
    }
  }
  return { ok: false, errors };
}
