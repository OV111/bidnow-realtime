const pad = (n: number) => String(n).padStart(2, '0');

export function formatCountdown(ms: number): string {
  const total = Math.floor(Math.max(0, ms) / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  if (days > 0) return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function formatClockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Used by the live screen
export function formatRemaining(ms: number): string {
  return formatCountdown(Math.ceil(Math.max(0, ms) / 1000) * 1000);
}

export function formatAgo(iso: string, now = Date.now()): string {
  const s = Math.floor((now - new Date(iso).getTime()) / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}