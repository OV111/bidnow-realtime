import type { AuctionStatus, AuctionSummary } from '@shared/types';
import type { CreateAuctionPayload } from '../features/createAuction/helpers';
import { summaries } from '../mock/auctions';

// The HTTP API lives on the same server as the socket. Without a URL the app runs on the mock socket.
const API_URL = (import.meta.env.VITE_API_URL ?? import.meta.env.VITE_SOCKET_URL) as string | undefined;

export type CreateAuctionError = 'no_server' | 'unauthorized' | 'invalid' | 'rate_limited' | 'network' | 'server';

export type CreateAuctionResult = { ok: true; id: string } | { ok: false; error: CreateAuctionError };

export async function createAuction(payload: CreateAuctionPayload, token: string): Promise<CreateAuctionResult> {
  if (!API_URL) return { ok: false, error: 'no_server' };

  let res: Response;
  try {
    res = await fetch(`${API_URL}/auctions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
  } catch {
    return { ok: false, error: 'network' };
  }

  if (res.status === 201) {
    const body = (await res.json()) as { id: string };
    return { ok: true, id: body.id };
  }
  if (res.status === 401) return { ok: false, error: 'unauthorized' };
  if (res.status === 400) return { ok: false, error: 'invalid' };
  if (res.status === 429) return { ok: false, error: 'rate_limited' };
  return { ok: false, error: 'server' };
}

export type ListAuctionsResult = { ok: true; data: AuctionSummary[] } | { ok: false; error: 'network' | 'server' };

export async function listAuctions(status?: AuctionStatus): Promise<ListAuctionsResult> {
  // No server configured: the app runs on mock data, so the list does too.
  if (!API_URL) return { ok: true, data: summaries.filter((a) => !status || a.status === status) };

  try {
    const res = await fetch(`${API_URL}/auctions${status ? `?status=${status}` : ''}`);
    if (!res.ok) return { ok: false, error: 'server' };
    return { ok: true, data: (await res.json()) as AuctionSummary[] };
  } catch {
    return { ok: false, error: 'network' };
  }
}
