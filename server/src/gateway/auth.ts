
import { verifyToken } from '../auth/jwt';
import { getUser } from '../auth/mockUsers';
import type { AppSocket } from './types';

// No token or expired token → guest (view only). Bad token or unknown user → rejected.
export function authMiddleware(socket: AppSocket, next: (err?: Error) => void) {
  socket.data.user = null;

  const token: unknown = socket.handshake.auth.token;
  if (typeof token !== 'string' || token === "") return next();

  const result = verifyToken(token);
  if (result.status === 'expired') {
    // TODO: tell the client (auth:expired)  it.
    console.log(`[auth] expired token, connecting ${socket.id} as guest`);
    return next();
  }
  if (result.status === 'invalid') return next(new Error('unauthorized'));

  const user = getUser(result.userId);
  if (!user) return next(new Error('unauthorized'));

  socket.data.user = user;
  next();
}