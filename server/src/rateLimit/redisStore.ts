import { RateLimitConfig, RateLimitResult, RateLimitStore } from "./types";
import type { Redis } from "ioredis";

// cause redis run lua script and node doesnt so we need to sned as string 
const Lua_Script = `
  local capacity = tonumber(ARGV[1])
  local refillPerSec = tonumber(ARGV[2])
  local time = redis.call('TIME')
  local nowMs = tonumber(time[1]) * 1000 + math.floor(tonumber(time[2])/1000)

  -- load enq anum saved buckety
  local saved = redis.call('HMGET',KEYS[1],'tokens','lastRefillMs')
  local tokens = tonumber(saved[1]) or capacity
  local lastRefillMs = tonumber(saved[2]) or nowMs

  local secondPassed = math.max(0,nowMs - lastRefillMs)/1000
  tokens = math.min(capacity,tokens+secondPassed *refillPerSec)
  
  local allowed = 0
  local retryAfterMs = 0

  if tokens >=1 then
    tokens = tokens-1
    allowed = 1
  else 
      retryAfterMs = math.ceil((1-tokens) / refillPerSec*1000)
  end

  -- as we need to work with multiple fields independently, we set with hash 
  redis.call('HSET',KEYS[1], 
            'tokens',tokens,
            'lastRefillMs',nowMs)
  -- cleaning inactive users requests 
  redis.call('PEXPIRE',KEYS[1],
            math.ceil(capacity / refillPerSec * 1000))
  
  return {allowed,math.floor(tokens),retryAfterMs}
  `

export class RedisStore implements RateLimitStore {
  constructor(private redis: Redis) { }
  async consume(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const [allowed, remaining, retryAfterMs] = await this.redis.eval(Lua_Script, 1, `rl:${key}`,
      config.capacity,  //ARG[1]
      config.refillPerSec, // ARG[2]
    ) as [number, number, number]
    return { allowed: allowed === 1, remaining, retryAfterMs };
  }
}