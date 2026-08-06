import React from 'react';
import { cn } from '../../lib/cn';

/* ─── Form section ──────────────────────────────────────────────────────────
   A titled band of related fields. Long record forms — a load, a driver — read
   as an undifferentiated wall of inputs without them; grouping is what lets
   someone scan for the field they came to change.
   ───────────────────────────────────────────────────────────────────────── */

export interface FormSectionProps {
  title: string;
  icon?: React.ReactNode;
  /** Right-aligned note in the header, e.g. "Owner operators only". */
  aside?: React.ReactNode;
  /** Field grid columns at md and up. Defaults to two. */
  columns?: 1 | 2 | 3;
  className?: string;
  children: React.ReactNode;
}

const COLUMNS: Record<1 | 2 | 3, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
};

export const FormSection: React.FC<FormSectionProps> = ({
  title, icon, aside, columns = 2, className, children,
}) => (
  <section className={cn('space-y-3', className)}>
    <div className="flex items-center justify-between gap-3 pb-1 border-b border-bd">
      <h4 className="flex items-center gap-2 text-fg-2 font-semibold uppercase tracking-wide text-[11px]">
        {icon}
        <span>{title}</span>
      </h4>
      {aside && <span className="text-[10.5px] text-fg-3 shrink-0">{aside}</span>}
    </div>
    <div className={cn('grid gap-4 items-start', COLUMNS[columns])}>{children}</div>
  </section>
);
