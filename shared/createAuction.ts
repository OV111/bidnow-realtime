import { z } from 'zod';

// One definition of the create-auction rules, used by the server (POST /auctions) and the client form.
// Error messages are short codes, not sentences: the client maps them to translated text.

export const MAX_PRICE_CENTS = 2000; // $20.00

export const ERR = {
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
      const start = b.startsAt ? time(b.startsAt) : null;
      const end = time(b.endsAt);
      return start === null || end === null || start < end;
    },
    { path: ['startsAt'], error: ERR.startsAfterEnd },
  );

export type CreateAuctionBody = z.infer<typeof createAuctionBody>;
