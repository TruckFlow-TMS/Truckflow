import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../lib/cn';

/* ─── Filter chips ──────────────────────────────────────────────────────────
   The design's primary filter affordance: a row of pills, the active one a
   solid accent fill. Replaces the <select> dropdowns the views used to carry —
   a dropdown hides the available filters and its height never matched the
   controls beside it, which is what made the old toolbars read as ragged.
   ───────────────────────────────────────────────────────────────────────── */

export interface FilterOption {
  value: string;
  label: string;
  /** Optional count rendered inside the pill. */
  count?: number;
}

export interface FilterChipsProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  /** Accessible name for the group, e.g. "Filter loads by status". */
  label: string;
  className?: string;
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  options, value, onChange, label, className,
}) => (
  <div role="group" aria-label={label} className={cn('flex items-center gap-1.5 flex-wrap', className)}>
    {options.map((opt) => {
      const active = opt.value === value;
      return (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          aria-pressed={active}
          className={cn(
            'h-7 px-3 rounded-full border text-[12px] inline-flex items-center gap-1.5',
            'transition-colors whitespace-nowrap shrink-0',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-surface',
            active
              ? 'border-transparent bg-accent text-on-accent font-semibold shadow-btn'
              : 'border-bd bg-surface text-fg-2 font-medium hover:text-fg hover:border-bd-strong',
          )}
        >
          {opt.label}
          {opt.count !== undefined && (
            <span className={cn('tnum text-[11px]', active ? 'text-on-accent/70' : 'text-fg-3')}>
              {opt.count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

/* ─── Search field ──────────────────────────────────────────────────────── */

export interface FilterSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const FilterSearch: React.FC<FilterSearchProps> = ({
  value, onChange, placeholder = 'Search…', className,
}) => (
  <div className={cn('relative w-full sm:w-[240px] shrink-0', className)}>
    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-3 pointer-events-none" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        'w-full h-8 pl-8 pr-3 bg-surface-2 border border-bd rounded-ctl',
        'text-[12.5px] text-fg placeholder:text-fg-3 transition-colors',
        'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20',
      )}
    />
  </div>
);

/* ─── Bar shell ─────────────────────────────────────────────────────────────
   Two tiers so a long chip set never shoulders the search field out of line:
   controls on top, chips beneath. The chip row is dropped entirely when a view
   has no chips, leaving a single clean row.
   ───────────────────────────────────────────────────────────────────────── */

export interface FilterBarProps {
  /** Search field — usually <FilterSearch />. */
  search?: React.ReactNode;
  /** Extra controls sitting beside the search (date ranges, view toggles). */
  extra?: React.ReactNode;
  /** Right-aligned result count. */
  meta?: React.ReactNode;
  /** Chip row — usually <FilterChips />. */
  chips?: React.ReactNode;
}

export const FilterBar: React.FC<FilterBarProps> = ({ search, extra, meta, chips }) => (
  <div className="w-full flex flex-col gap-2.5">
    {(search || extra || meta) && (
      <div className="flex items-center gap-2 flex-wrap">
        {search}
        {extra}
        {meta && (
          <span className="ml-auto text-[11.5px] text-fg-3 tnum shrink-0">{meta}</span>
        )}
      </div>
    )}
    {chips}
  </div>
);
