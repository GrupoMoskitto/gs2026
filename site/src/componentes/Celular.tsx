import type { ReactNode } from 'react';

/** Moldura de celular para as telas do app (proporção 9:20, a mesma das capturas). */
export function Celular({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-[13%/6%] border-[6px] border-marinho bg-marinho dark:border-black dark:bg-black dark:ring-1 dark:ring-white/15 ${className}`}
    >
      <div className="aspect-[9/20] overflow-hidden rounded-[10%/4.6%] bg-superficie">{children}</div>
    </div>
  );
}
