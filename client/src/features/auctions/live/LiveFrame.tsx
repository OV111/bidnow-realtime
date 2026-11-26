import type { ReactNode } from 'react';

interface Props {
  centered?: boolean;
  children: ReactNode;
}

function LiveFrame({ centered = false, children }: Props) {
  return (
    <main className="flex min-h-dvh w-full cursor-none flex-col bg-black p-[4vmin] text-white select-none">
      {centered ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-[3vmin] text-center">{children}</div>
      ) : (
        children
      )}
    </main>
  );
}

export default LiveFrame;
