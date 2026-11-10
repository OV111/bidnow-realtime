import type { ReactNode } from 'react';

interface Props {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}

export function Field({ id, label, error, children }: Props) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

const inputBase =
  'w-full rounded-xl border border-slate-300 py-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100';

export const inputClass = `${inputBase} px-3`;
export const priceInputClass = `${inputBase} pr-3 pl-8 tabular-nums`;
