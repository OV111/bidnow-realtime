import useNow from '@/hooks/useNow';

function useCountdown(target: string, clockOffsetMs = 0) {
  const now = useNow(250);
  return Math.max(0, new Date(target).getTime() - (now + clockOffsetMs));
}

export default useCountdown;
