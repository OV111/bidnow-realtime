import { t } from '@/i18n';

const SECONDS_IN_MINUTE = 60;
const SECONDS_IN_HOUR = 60 * 60;
const SECONDS_IN_DAY = 24 * 60 * 60;

function twoDigits(value: number) {
  return String(value).padStart(2, '0');
}

export function formatCountdown(ms: number) {
  const totalSeconds = Math.ceil(Math.max(0, ms) / 1000);

  const days = Math.floor(totalSeconds / SECONDS_IN_DAY);
  const hours = Math.floor((totalSeconds % SECONDS_IN_DAY) / SECONDS_IN_HOUR);
  const minutes = Math.floor((totalSeconds % SECONDS_IN_HOUR) / SECONDS_IN_MINUTE);
  const seconds = totalSeconds % SECONDS_IN_MINUTE;

  const minutesAndSeconds = `${twoDigits(minutes)}:${twoDigits(seconds)}`;

  if (days > 0) return `${days}d ${twoDigits(hours)}:${minutesAndSeconds}`;
  if (hours > 0) return `${hours}:${minutesAndSeconds}`;
  return minutesAndSeconds;
}

export function formatClockTime(date: string) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function formatTimeAgo(date: string, now = Date.now()) {
  const seconds = Math.floor((now - new Date(date).getTime()) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 5) return t('time.justNow');
  if (seconds < 60) return t('time.secondsAgo', { count: seconds });
  if (minutes < 60) return t('time.minutesAgo', { count: minutes });
  return t('time.hoursAgo', { count: hours });
}
