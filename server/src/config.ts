import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(4000),
  CLIENT_URL: z
    .string()
    .transform((value) => value.split(',').map((url) => url.trim()))
    .pipe(z.array(z.url()).min(1)),
  JWT_SECRET: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
});

export const config = schema.parse(process.env);
