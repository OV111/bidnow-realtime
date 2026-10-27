import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(4000),
  CLIENT_URL: z.url(),
  JWT_SECRET:z.string().min(1),
});

export const config = schema.parse(process.env);
