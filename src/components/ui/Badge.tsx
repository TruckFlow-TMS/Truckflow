import React from 'react';
import { cn } from '../../lib/cn';

export type Tone = 'pos' | 'warn' | 'violet' | 'danger' | 'neutral' | 'accent';

const TONES: Record<Tone, string> = {
  pos: 'bg-pos-bg text-pos',
  warn: 'bg-warn-bg text-warn',
  violet: 'bg-violet-bg text-violet',
  danger: 'bg-danger-bg text-danger',
  neutral: 'bg-neutral-bg text-neutral',
  accent: 'bg-accent-weak text-accent',
};

/** Map any domain status string to a badge tone. */
export function statusTone(status: string): Tone {
  switch (status) {
    // loads
    case 'OPEN': return 'neutral';
    case 'DISPATCHED': return 'violet';
    case 'IN_TRANSIT': return 'warn';
    case 'DELIVERED':
    case 'DELIVERED_POD': return 'pos';
    case 'INVOICED': return 'violet';
    case 'PAID': return 'pos';
    case 'CANCELLED': return 'danger';
    case 'ON_HOLD': return 'warn';
    // drivers / equipment
    case 'ACTIVE':
    case 'AVAILABLE': return 'pos';
    case 'ON_LOAD': return 'warn';
    case 'INACTIVE': return 'neutral';
    case 'MAINTENANCE': return 'warn';
    case 'OUT_OF_SERVICE': return 'danger';
    // invoices
    case 'DRAFT': return 'neutral';
    case 'ISSUED': return 'accent';
    case 'OVERDUE': return 'danger';
    case 'VOID': return 'neutral';
    case 'SUBMITTED_TO_FACTORING': return 'violet';
    case 'ADVANCED': return 'pos';
    case 'DISPUTED': return 'danger';
    default: return 'neutral';
  }
}

/** Turn IN_TRANSIT into "In transit". */
export function humanizeStatus(status: string): string {
  const s = status.replace(/_/g, ' ').toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  tone = 'neutral',
  dot = true,
  className,
  children,
  ...rest
}) => (
  <span
    {...rest}
    className={cn(
      'inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-full text-[11px] font-semibold whitespace-nowrap',
      TONES[tone],
      className,
    )}
  >
    {dot && <span className="w-[5px] h-[5px] rounded-full bg-current shrink-0" />}
    {children}
  </span>
);
