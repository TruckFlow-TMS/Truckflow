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
  const d = spark ? sparkPath(spark) : '';
  const interactive = !!onClick;

  return (
    <div
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } } : undefined}
      className={cn(
        'rounded-card border border-bd bg-surface shadow-card p-3.5 relative overflow-hidden transition-all duration-200 group select-none',
        'hover:bg-accent-grad hover:border-transparent hover:shadow-hero hover:scale-[1.025]',
        interactive && 'cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        className,
      )}
    >
      {variant === 'ring' && ringPct !== undefined && (
        <svg viewBox="0 0 36 36" className="float-right w-9 h-9 relative z-10">
          <circle cx="18" cy="18" r="15" fill="none" strokeWidth="4" className="stroke-bd group-hover:stroke-white/30 transition-colors" />
          <circle
            cx="18" cy="18" r="15" fill="none" strokeWidth="4" strokeLinecap="round"
            className="stroke-pos group-hover:stroke-white transition-colors"
            strokeDasharray={`${(ringPct / 100) * 94.2} 94.2`}
            transform="rotate(-90 18 18)"
          />
        </svg>
      )}

      <div className="relative z-10 text-[11.5px] font-medium text-fg-2 group-hover:text-white/80 transition-colors">
        {label}
      </div>
      <div className="relative z-10 text-[22px] font-semibold mt-1 tnum leading-tight tracking-tight text-fg group-hover:text-white transition-colors">
        {value}
      </div>
      {sub && (
        <div className="relative z-10 text-[10.5px] mt-1 tnum text-fg-3 group-hover:text-white/80 transition-colors">
          {sub}
        </div>
      )}

      {d && (
        <svg viewBox="0 0 200 30" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[28px] opacity-40 group-hover:opacity-60 z-0 text-accent group-hover:text-white pointer-events-none transition-all">
          <path d={`${d} L200 30 L0 30 Z`} fill="currentColor" fillOpacity={0.2} />
          <path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
};
