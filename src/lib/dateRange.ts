/**
 * Calendar-period date filtering, shared by every view that scopes figures to a
 * timeframe (dashboard KPIs, loads book, billing). Keeping the period maths in
 * one place is what stops "this month" meaning two different things on two
 * pages.
 *
 * Everything here works in the operator's local calendar. Dates are handled as
 * YYYY-MM-DD strings because that is how the records store them, and a bare
 * date string passed through Date.parse would be read as UTC midnight — an
 * off-by-one day for anyone not on GMT.
 */

export type DateRangePreset = 'ALL' | 'WEEK' | 'MONTH' | 'YEAR' | 'CUSTOM';

export interface DateRange {
  preset: DateRangePreset;
  /** Only meaningful when preset is CUSTOM. */
  start: string;
  end: string;
}

export const ALL_TIME: DateRange = { preset: 'ALL', start: '', end: '' };

export const PRESET_LABELS: Record<DateRangePreset, string> = {
  ALL: 'All time',
  WEEK: 'This week',
  MONTH: 'This month',
  YEAR: 'This year',
  CUSTOM: 'Custom',
};

/** Format from local calendar fields; toISOString() would shift the day. */
export const ymd = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Read a bare YYYY-MM-DD as a local calendar day. */
export const parseYmd = (s: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
};

/**
 * First day of the calendar period containing `ref`. Weeks run Monday to
 * Sunday, matching how settlement weeks are cut.
 */
export const startOfPeriod = (preset: 'WEEK' | 'MONTH' | 'YEAR', ref: Date = new Date()): Date => {
  if (preset === 'YEAR') return new Date(ref.getFullYear(), 0, 1);
  if (preset === 'MONTH') return new Date(ref.getFullYear(), ref.getMonth(), 1);
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // getDay(): Sunday = 0
  return d;
};

/**
 * The range as inclusive YYYY-MM-DD bounds. An empty bound means unbounded —
 * periods have no upper bound on purpose, so a load delivering later this month
 * still counts toward it.
 */
export const resolveRange = (range: DateRange, ref: Date = new Date()): { start: string; end: string } => {
  switch (range.preset) {
    case 'ALL': return { start: '', end: '' };
    case 'CUSTOM': return { start: range.start, end: range.end };
    default: return { start: ymd(startOfPeriod(range.preset, ref)), end: '' };
  }
};

/** Is a record's date inside the range? Undated records are always included. */
export const inRange = (date: string | undefined, range: DateRange, ref: Date = new Date()): boolean => {
  if (!date) return true;
  const { start, end } = resolveRange(range, ref);
  const day = date.slice(0, 10); // YYYY-MM-DD sorts lexically, so compare as strings
  if (start && day < start) return false;
  if (end && day > end) return false;
  return true;
};

/** Human label for the active range, for use in card labels and headings. */
export const rangeLabel = (range: DateRange): string => {
  if (range.preset !== 'CUSTOM') return PRESET_LABELS[range.preset];
  if (range.start && range.end) return `${range.start} → ${range.end}`;
  if (range.start) return `From ${range.start}`;
  if (range.end) return `Until ${range.end}`;
  return PRESET_LABELS.ALL;
};
