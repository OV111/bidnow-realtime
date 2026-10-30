import jwt from "jsonwebtoken";
import { config } from "../config";

export function signToken(userId: string): string {
  return jwt.sign({}, config.JWT_SECRET, { subject: userId, expiresIn: '7d' });
}

export type VerifyResult = { status: 'valid'; userId: string } | { status: 'expired' } | { status: 'invalid' };

export function verifyToken(token: string): VerifyResult {
  try {
    const payload = jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof payload === "string" || !payload.sub) return { status: 'invalid' };
    return { status: 'valid', userId: payload.sub };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) return { status: 'expired' };
    return { status: 'invalid' };
  }
}