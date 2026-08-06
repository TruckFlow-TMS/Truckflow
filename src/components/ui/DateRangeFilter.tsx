import React from 'react';
import { cn } from '../../lib/cn';
import { DateRange, DateRangePreset, PRESET_LABELS } from '../../lib/dateRange';
import { Input } from './Input';

/* ─── Date range filter ─────────────────────────────────────────────────────
   The timeframe control every list view shares: calendar presets as pills, with
   a Custom pill that reveals from/to inputs. Presets rather than two bare date
   fields, because "this month" is the question operators actually ask and
   typing both ends of it by hand is the slowest way to answer it.
   ───────────────────────────────────────────────────────────────────────── */

const PRESETS: DateRangePreset[] = ['ALL', 'WEEK', 'MONTH', 'YEAR', 'CUSTOM'];

export interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  /** Accessible name, e.g. "Filter loads by pickup date". */
  label: string;
  className?: string;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  value, onChange, label, className,
}) => (
  <div className={cn('flex items-center gap-2 flex-wrap', className)}>
    <div role="group" aria-label={label} className="flex items-center gap-1.5 flex-wrap">
      {PRESETS.map((preset) => {
        const active = preset === value.preset;
        return (
          <button
            key={preset}
            type="button"
            aria-pressed={active}
            onClick={() => onChange({ ...value, preset })}
            className={cn(
              'h-7 px-3 rounded-full border text-[12px] whitespace-nowrap shrink-0 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-surface',
              active
                ? 'border-transparent bg-accent text-on-accent font-semibold shadow-btn'
                : 'border-bd bg-surface text-fg-2 font-medium hover:text-fg hover:border-bd-strong',
            )}
          >
            {PRESET_LABELS[preset]}
          </button>
        );
      })}
    </div>

    {value.preset === 'CUSTOM' && (
      <div className="flex items-center gap-1.5">
        <Input
          type="date"
          aria-label={`${label} — from`}
          value={value.start}
          onChange={(e) => onChange({ ...value, start: e.target.value })}
          className="h-7 w-auto text-[12px] tnum"
        />
        <span className="text-[11.5px] text-fg-3">to</span>
        <Input
          type="date"
          aria-label={`${label} — to`}
          value={value.end}
          onChange={(e) => onChange({ ...value, end: e.target.value })}
          className="h-7 w-auto text-[12px] tnum"
        />
      </div>
    )}
  </div>
);
