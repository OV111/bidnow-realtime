
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
    socket.data.tokenExpired = true;
    console.log(`auth expired token, connecting as guest`);
    return next();
  }
  if (result.status === 'invalid') return next(new Error('unauthorized'));

  const user = getUser(result.userId);
  if (!user) return next(new Error('unauthorized'));

  socket.data.user = user;
  // after user connected, we save token that user cant rejoin with expired token
  socket.data.tokenExp = result.exp;
  next();
}