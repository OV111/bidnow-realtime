import type {Server,Socket} from 'socket.io';
import type { ClientToServerEvents,ServerToClientEvents,SocketData } from '@shared/events';

export type AppServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
export type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;