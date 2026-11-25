import { z } from 'zod';

// One definition of the create-auction rules, used by the server (POST /auctions) and the client form.
// Error messages are short codes, not sentences: the client maps them to translated text.

export const MAX_PRICE_CENTS = 100_000_000; // $1,000,000; must stay below DB Int (int32) max of 2,147,483,647

// An auction must run between 1 minute and 30 days (measured from its start), and end within 90 days from now.
export const MIN_DURATION_MS = 60 * 1000;
export const MAX_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
export const MAX_END_HORIZON_MS = 90 * 24 * 60 * 60 * 1000;

export const ERR = {
  durationTooShort: 'duration_too_short',
  durationTooLong: 'duration_too_long',
  required: 'required',
  tooLong: 'too_long',
  priceInvalid: 'price_invalid',
  priceMax: 'price_max',
  urlInvalid: 'url_invalid',
  datetimeInvalid: 'datetime_invalid',
  buyNowTooLow: 'buy_now_too_low',
  endsInPast: 'ends_in_past',
  startsAfterEnd: 'starts_after_end',
  invalid: 'invalid',
} as const;

export type CreateAuctionErrorCode = (typeof ERR)[keyof typeof ERR];

const cents = z
  .number(ERR.priceInvalid)
  .int(ERR.priceInvalid)
  .positive(ERR.priceInvalid)
  .max(MAX_PRICE_CENTS, ERR.priceMax);

const datetime = z.iso.datetime({
  error: (issue) => (issue.input === undefined ? ERR.required : ERR.datetimeInvalid),
});

// Cross-field checks only compare dates that parsed; a bad date already has its own error.
const time = (iso: string) => {
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
};

export const createAuctionBody = z
  .object({
    title: z.string(ERR.required).trim().min(1, ERR.required).max(120, ERR.tooLong),
    description: z.string().trim().max(2000, ERR.tooLong).nullish(),
    photoUrl: z.url({ protocol: /^https?$/, error: ERR.urlInvalid }),
    currency: z.string().regex(/^[A-Z]{3}$/, ERR.invalid).default('USD'),
    startPrice: cents,
    minIncrement: cents,
    buyNowPrice: cents.nullish(),
    startsAt: datetime.nullish(),
    endsAt: datetime,
  })
  .refine((b) => b.buyNowPrice == null || b.buyNowPrice > b.startPrice, {
    path: ['buyNowPrice'],
    error: ERR.buyNowTooLow,
  })
  .refine(
    (b) => {
      const end = time(b.endsAt);
      return end === null || end > Date.now();
    },
    { path: ['endsAt'], error: ERR.endsInPast },
  )
  .refine(
    (b) => {
      const end = time(b.endsAt);
      const start = b.startsAt ? time(b.startsAt) : null;
      if (end === null || end <= Date.now()) return true; // already reported by endsInPast
      if (start !== null && start >= end) return true; // already reported by startsAfterEnd
      return end - Math.max(start ?? 0, Date.now()) >= MIN_DURATION_MS;
    },
    { path: ['endsAt'], error: ERR.durationTooShort },
  )
  .refine(
    (b) => {
      const end = time(b.endsAt);
      const start = b.startsAt ? time(b.startsAt) : null;
      if (end === null) return true;
      return end - Math.max(start ?? 0, Date.now()) <= MAX_DURATION_MS && end - Date.now() <= MAX_END_HORIZON_MS;
    },
    { path: ['endsAt'], error: ERR.durationTooLong },
  )
  .refine(
    (b) => {
      const start = b.startsAt ? time(b.startsAt) : null;
      const end = time(b.endsAt);
      return start === null || end === null || start < end;
    },
    { path: ['startsAt'], error: ERR.startsAfterEnd },
  );

export type CreateAuctionBody = z.infer<typeof createAuctionBody>;
