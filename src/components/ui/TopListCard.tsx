import React from 'react';
import { cn } from '../../lib/cn';

/* ─── Top list card ──────────────────────────────────────────────────────────
   A ranked leaderboard sized to drop into a StatCard grid. Where a StatCard
   answers "how much", this answers "who" — a single aggregate can't tell you
   the book is carried by two brokers.

   No accent-gradient hover: the card is a readout, not a button, and the
   gradient would wash out the ranking bars that carry the comparison.
   ─────────────────────────────────────────────────────────────────────────── */

export interface TopListItem {
  id: string;
  label: string;
  /** Pre-formatted for display, e.g. "$142.5k". */
  value: string;
  /** Relative magnitude for the bar. Any scale; normalized against the max. */
  weight: number;
}

export interface TopListCardProps {
  label: string;
  items: TopListItem[];
  sub?: React.ReactNode;
  emptyText?: string;
  className?: string;
}

export const TopListCard: React.FC<TopListCardProps> = ({
  label, items, sub, emptyText = 'No data yet', className,
}) => {
  const max = Math.max(...items.map((i) => i.weight), 1);

  return (
    <div
      className={cn(
        'rounded-card border border-bd bg-surface shadow-card p-3.5 transition-colors duration-200',
        'hover:border-accent/50',
        className,
      )}
    >
      <div className="text-[11.5px] font-medium text-fg-2">{label}</div>

      {items.length === 0 ? (
        <div className="mt-2 text-[11px] text-fg-3">{emptyText}</div>
      ) : (
        <ol className="mt-1.5 space-y-[3px]">
          {items.map((item, i) => (
            <li key={item.id} className="relative flex items-center gap-1.5 h-[17px] px-1 -mx-1 rounded-[4px] overflow-hidden">
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 bg-accent-weak rounded-[4px]"
                style={{ width: `${Math.max((item.weight / max) * 100, 4)}%` }}
              />
              <span className="relative z-10 text-[10px] font-semibold text-fg-3 tnum w-[9px] shrink-0">{i + 1}</span>
              <span className="relative z-10 text-[11px] font-medium text-fg truncate flex-1" title={item.label}>
                {item.label}
              </span>
              <span className="relative z-10 text-[11px] font-semibold text-fg-2 tnum shrink-0">{item.value}</span>
            </li>
          ))}
        </ol>
      )}

      {sub && <div className="text-[10.5px] mt-1.5 text-fg-3 tnum">{sub}</div>}
    </div>
  );
};
