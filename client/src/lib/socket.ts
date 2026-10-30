import { io, type Socket } from 'socket.io-client';

import type { ClientToServerEvents, ServerToClientEvents } from '@shared/events';

export type LiveSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// token is null for guests: they can watch but not bid.
export function createSocket(url: string, token: string | null = null): LiveSocket {
  return io(url, { auth: token ? { token } : {}, reconnection: true });
}
