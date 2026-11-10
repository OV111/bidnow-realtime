import { sanitizePrice } from '../helpers';
import { priceInputClass } from './Field';

interface Props {
  id: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

export function PriceInput({ id, value, disabled, onChange }: Props) {
  return (
    <div className="relative">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-3 flex items-center font-semibold text-slate-500"
      >
        $
      </span>
      <input
        id={id}
        value={value}
        disabled={disabled}
        inputMode="decimal"
        autoComplete="off"
        placeholder="0.00"
        onChange={(e) => onChange(sanitizePrice(e.target.value, value))}
        className={priceInputClass}
      />
    </div>
  );
}
