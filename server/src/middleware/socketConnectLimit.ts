import type { AppSocket } from "../gateway/types";
import { createLimiter, type RateLimitConfig } from "../rateLimit";
import { getClientIp } from "./clientIp";

export function createSocketConnectLimit(name: string, config: RateLimitConfig) {
  const limiter = createLimiter(name, config);

  const connectLimit = async (socket: AppSocket, next: (err?: Error) => void) => {
    const ip = getClientIp(socket)
    const result = await limiter.check(ip);
    if (result.allowed) return next();
    next(new Error("rate_limited"));
  }
  return connectLimit
}