import type { ReactNode } from 'react';

import { cn } from '../../lib/utils';

export function Modal({ open, title, children }: { open: boolean; title?: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className={cn('w-full max-w-lg rounded-lg bg-white p-4 shadow-lg')}>
        {title ? <div className="mb-3 text-base font-semibold text-slate-900">{title}</div> : null}
        {children}
      </div>
    </div>
  );
}
