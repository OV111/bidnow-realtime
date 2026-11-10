import { z } from 'zod'

export const listQuery = z.object({
  status: z.enum(['SCHEDULED', 'LIVE', 'ENDED']).optional(),
  limit: z.coerce.number().int().positive().optional(),
})