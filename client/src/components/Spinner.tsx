function Spinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-500" role="status">
      <span className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" aria-hidden />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export default Spinner;
