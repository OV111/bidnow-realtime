import { useState } from 'react';

import { priceInputClass } from '@/features/auctions/create/inputStyles';
import { cleanPriceInput } from '@/features/auctions/create/validation';

function PriceInput({ name }: { name: string }) {
  const [value, setValue] = useState('');

  return (
    <span className="relative block">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-3 flex items-center font-semibold text-slate-500"
      >
        $
      </span>
      <input
        name={name}
        value={value}
        onChange={(event) => setValue(cleanPriceInput(event.target.value, value))}
        inputMode="decimal"
        autoComplete="off"
        placeholder="0.00"
        className={priceInputClass}
      />
    </span>
  );
}

export default PriceInput;
