export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL as string | undefined;

export const API_URL = (import.meta.env.VITE_API_URL ?? SOCKET_URL) as string | undefined;

if (import.meta.env.PROD && !SOCKET_URL) {
  throw new Error('VITE_SOCKET_URL is required in production');
}
