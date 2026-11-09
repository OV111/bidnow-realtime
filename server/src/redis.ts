
import { Redis } from "ioredis"
import { config } from "./config";

export const redis = new Redis(
  config.REDIS_URL ?? 'redis://localhost:6379',
  {
    // default is 20 retries but i need immediate
    maxRetriesPerRequest: 1,
  })

redis.on('error', (err) => {
  console.log(err)
})

