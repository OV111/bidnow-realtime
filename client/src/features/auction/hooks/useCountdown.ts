import { useNow } from './useNow';

export function useCountdown(endsAt: string, offsetMs = 0): number {
  const now = useNow();
  return Math.max(0, new Date(endsAt).getTime() - (now + offsetMs));
}
