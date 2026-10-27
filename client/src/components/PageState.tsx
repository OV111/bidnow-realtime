import type { ReactNode } from 'react';

export function Spinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-500" role="status">
      <span className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" aria-hidden />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-24 text-center">
      <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
      {body && <p className="max-w-sm text-sm text-slate-600">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
