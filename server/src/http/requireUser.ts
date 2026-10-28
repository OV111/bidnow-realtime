import type { RequestHandler } from 'express';

import { verifyToken } from '../auth/jwt';
import { getUser, type MockUser } from '../auth/mockUsers';

export interface AuthLocals {
  user: MockUser;
}

export const requireUser: RequestHandler<unknown, unknown, unknown, unknown, AuthLocals> = (req, res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  const result = token ? verifyToken(token) : null;
  const user = result?.status === 'valid' ? getUser(result.userId) : null;
  if (!user) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  res.locals.user = user;
  next();
};
