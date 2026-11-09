import { config } from '../config';

export type Notification =
  | {
      type: 'outbid';
      userId: string;
      auctionId: string;
      auctionTitle: string;
      currentPrice: number;
      currency: string;
    }
  | {
      type: 'won';
      userId: string;
      auctionId: string;
      auctionTitle: string;
      finalPrice: number;
      currency: string;
      reason: 'timer' | 'buy_now';
    };

const TIMEOUT_MS = 3_000;

async function deliver(notification: Notification) {
  if (!config.USER_FLOW_URL) {
    console.log(`[notify] ${notification.type} -> ${notification.userId} (${notification.auctionId})`);
    return;
  }
  const res = await fetch(new URL('/notifications', config.USER_FLOW_URL), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.USER_FLOW_API_KEY && { Authorization: `Bearer ${config.USER_FLOW_API_KEY}` }),
    },
    body: JSON.stringify(notification),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`User Flow responded ${res.status}`);
}

export function notify(notification: Notification) {
  deliver(notification).catch((err) => {
    console.error(`[notify] ${notification.type} -> ${notification.userId} failed`, err);
  });
}
