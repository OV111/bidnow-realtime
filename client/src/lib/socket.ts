import { io, type Socket } from 'socket.io-client';

import type {
  AuctionEndedDto,
  AuctionSnapshotDto,
  BidPlacedDto,
  SnapshotResponse,
  TimerExtendedDto,
} from './types';

export interface ServerToClientEvents {
  'auction:snapshot': (auction: AuctionSnapshotDto) => void;
  'bid:placed': (payload: BidPlacedDto) => void;
  'timer:extended': (payload: TimerExtendedDto) => void;
  'auction:ended': (payload: AuctionEndedDto) => void;
}

export interface ClientToServerEvents {
  'auction:join': (payload: { auctionId: string; role: 'viewer' }) => void;
  'auction:snapshot': (payload: { auctionId: string }, ack: (res: SnapshotResponse) => void) => void;
}

export type LiveSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function createViewerSocket(url: string): LiveSocket {
  return io(url, { auth: { role: 'viewer' }, reconnection: true });
}
