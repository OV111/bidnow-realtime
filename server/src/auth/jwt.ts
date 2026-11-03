import jwt from "jsonwebtoken";
import { config } from "../config";

export function signToken(userId: string): string {
  return jwt.sign({}, config.JWT_SECRET, { subject: userId, expiresIn: '7d' });
}

export type VerifyResult = { status: 'valid'; userId: string, exp: number, } | { status: 'expired' } | { status: 'invalid' };

export function verifyToken(token: string): VerifyResult {
  try {
    const payload = jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof payload === "string" || !payload.sub || !payload.exp) return { status: 'invalid' };
    return { status: 'valid', userId: payload.sub, exp: payload.exp };
  } catch (err) {
    if ((err as Error).name === 'TokenExpiredError') return { status: 'expired' };
    return { status: 'invalid' };
  }
}