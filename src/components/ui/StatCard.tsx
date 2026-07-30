import React from 'react';
import { cn } from '../../lib/cn';

export interface StatCardProps {
  label: string;
  value: string;
  sub?: React.ReactNode;
  variant?: 'default' | 'hero' | 'ring';
  /** hero only: values are normalized internally, any scale works */
  spark?: number[];
  /** ring only: 0-100 */
  ringPct?: number;
  className?: string;
  onClick?: () => void;
}

function sparkPath(values: number[], w = 200, h = 30): string {
  if (values.length < 2) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / span) * (h - 4) - 2;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}

export const StatCard: React.FC<StatCardProps> = ({
  label, value, sub, variant = 'default', spark, ringPct, className, onClick,
}) => {
  const hero = variant === 'hero';
  const d = hero && spark ? sparkPath(spark) : '';
  const interactive = !!onClick;

  return (
    <div
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } } : undefined}
      className={cn(
        'rounded-card border p-3.5 relative overflow-hidden transition-all duration-200',
        hero
          ? 'bg-accent-grad border-transparent shadow-hero pb-6'
          : 'bg-surface border-bd shadow-card',
        interactive && 'cursor-pointer hover:shadow-lift hover:scale-[1.02] hover:border-accent/40 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        className,
      )}
    >
      {variant === 'ring' && ringPct !== undefined && (
        <svg viewBox="0 0 36 36" className="float-right w-9 h-9">
          <circle cx="18" cy="18" r="15" fill="none" strokeWidth="4" className="stroke-bd" />
          <circle
            cx="18" cy="18" r="15" fill="none" strokeWidth="4" strokeLinecap="round"
            className="stroke-pos"
            strokeDasharray={`${(ringPct / 100) * 94.2} 94.2`}
            transform="rotate(-90 18 18)"
          />
        </svg>
      )}

      <div className={cn('relative z-10 text-[11.5px] font-medium', hero ? 'text-on-hero/70' : 'text-fg-2')}>
        {label}
      </div>
      <div className={cn('relative z-10 text-[22px] font-semibold mt-1 tnum leading-tight tracking-tight', hero ? 'text-on-hero' : 'text-fg')}>
        {value}
      </div>
      {sub && (
        <div className={cn('relative z-10 text-[10.5px] mt-1 tnum', hero ? 'text-on-hero/70' : 'text-fg-3')}>
          {sub}
        </div>
      )}

      {hero && d && (
        <svg viewBox="0 0 200 30" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[30px] opacity-50 z-0 text-on-hero">
          <path d={`${d} L200 30 L0 30 Z`} fill="currentColor" fillOpacity={0.2} />
          <path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
};
