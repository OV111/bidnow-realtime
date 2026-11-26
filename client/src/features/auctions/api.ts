import type { CreateAuctionBody } from '@shared/createAuction';
import type { AuctionStatus, AuctionSummary, Result } from '@shared/types';

import { API_URL } from '@/lib/config';

export type CreateAuctionError = 'no_server' | 'unauthorized' | 'invalid' | 'rate_limited' | 'network' | 'server';

function errorFromStatus(status: number): CreateAuctionError {
  if (status === 400) return 'invalid';
  if (status === 401) return 'unauthorized';
  if (status === 429) return 'rate_limited';
  return 'server';
}

export async function createAuction(payload: CreateAuctionBody, token: string): Promise<Result<string, CreateAuctionError>> {
  if (!API_URL) return { ok: false, error: 'no_server' };

  try {
    const response = await fetch(`${API_URL}/auctions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });

    if (!response.ok) return { ok: false, error: errorFromStatus(response.status) };

    const { id } = await response.json();
    return { ok: true, data: id };
  } catch {
    return { ok: false, error: 'network' };
  }
}

export async function listAuctions(status?: AuctionStatus): Promise<Result<AuctionSummary[], 'network' | 'server'>> {
  if (!API_URL) {
    if (!import.meta.env.DEV) return { ok: false, error: 'server' };

    const { summaries } = await import('@/mock/auctions');
    return { ok: true, data: summaries.filter((auction) => !status || auction.status === status) };
  }

  const query = status ? `?status=${status}` : '';

  try {
    const response = await fetch(`${API_URL}/auctions${query}`);
    if (!response.ok) return { ok: false, error: 'server' };

    return { ok: true, data: await response.json() };
  } catch {
    return { ok: false, error: 'network' };
  }
}
