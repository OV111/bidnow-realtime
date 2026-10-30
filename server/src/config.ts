import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(4000),
  CLIENT_URL: z
    .string()
    .transform((value) => value.split(',').map((url) => url.trim()))
    .pipe(z.array(z.url()).min(1)),
  JWT_SECRET:z.string().min(1),
  DATABASE_URL: z.string().min(1),
});

export const config = schema.parse(process.env);
