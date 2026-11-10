import 'dotenv/config';
import { z } from 'zod';

const unsetIfEmpty = (value: unknown) => (value === '' ? undefined : value);

const schema = z.object({
  PORT: z.coerce.number().default(4000),
  CLIENT_URL: z
    .string()
    .transform((value) => value.split(',').map((url) => url.trim()))
    .pipe(z.array(z.url()).min(1)),
  JWT_SECRET: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1).optional(),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  ANTI_SNIPE_WINDOW_SEC: z.coerce.number().int().min(0).default(10),
  ANTI_SNIPE_EXTEND_SEC: z.coerce.number().int().min(0).default(10),
  USER_FLOW_URL: z.preprocess(unsetIfEmpty, z.url().optional()),
  USER_FLOW_API_KEY: z.preprocess(unsetIfEmpty, z.string().min(1).optional()),

  MAX_OPEN_AUCTIONS_PER_SELLER: z.coerce.number().int().positive().default(5),
  LIST_PAGE_DEFAULT: z.coerce.number().int().positive().default(20),
  LIST_PAGE_MAX: z.coerce.number().int().positive().default(50),
});

export const config = schema.parse(process.env);
