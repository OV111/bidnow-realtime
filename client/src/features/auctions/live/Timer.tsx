import useCountdown from '@/features/auctions/useCountdown';
import { t } from '@/i18n';
import { formatCountdown } from '@/lib/time';

interface Props {
  endsAt: string;
  clockOffsetMs: number;
  extendedAt: number | null;
}

function Timer({ endsAt, clockOffsetMs, extendedAt }: Props) {
  const remaining = useCountdown(endsAt, clockOffsetMs);
  const urgent = remaining <= 10_000;

  return (
    <div className="relative">
      <p className="text-[3vmin] text-zinc-400">{t('live.timeLeft')}</p>
      <p
        className={`text-[14vmin] leading-none font-bold tabular-nums ${urgent ? 'animate-pulse text-red-500' : ''}`}
      >
        {formatCountdown(remaining)}
      </p>
      {extendedAt && (
        <p
          key={extendedAt}
          className="animate-fade-in-out absolute top-0 right-0 rounded-full bg-amber-400 px-[2vmin] py-[1vmin] text-[3vmin] font-bold text-black opacity-0"
        >
          {t('live.extended')}
        </p>
      )}
    </div>
  );
}

export default Timer;
