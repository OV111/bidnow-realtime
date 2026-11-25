export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL as string | undefined;

// The HTTP API lives on the same server as the socket unless VITE_API_URL says otherwise.
export const API_URL = (import.meta.env.VITE_API_URL ?? SOCKET_URL) as string | undefined;

// Mock data is for local UI work only. A production build must never fall back to it silently.
if (import.meta.env.PROD && !SOCKET_URL) {
  throw new Error('VITE_SOCKET_URL is required in production');
}
