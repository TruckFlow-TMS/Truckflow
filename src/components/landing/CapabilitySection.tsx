import React from 'react';
import { Check, DollarSign, Kanban, ShieldCheck, Truck } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Capability } from './content';

/** Keyed to Capability.id, reusing the sidebar's icon vocabulary. */
const ICONS: Record<string, React.ReactNode> = {
  dispatch: <Kanban size={20} />,
  fleet: <Truck size={20} />,
  money: <DollarSign size={20} />,
  control: <ShieldCheck size={20} />,
};

export interface CapabilitySectionProps {
  capability: Capability;
  /** Even indices put the prose left; odd reverse it. */
  index: number;
}

export const CapabilitySection: React.FC<CapabilitySectionProps> = ({ capability, index }) => {
  const flipped = index % 2 === 1;

  return (
    <section className={cn('py-14 sm:py-20', index % 2 === 1 && 'bg-surface-2')}>
      <div className="mx-auto max-w-[1120px] px-5 sm:px-8">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          {/* Source order keeps prose first, so the stacked mobile layout reads
              correctly; the reversal is a grid-column swap, not a DOM reorder. */}
          <div className={cn(flipped && 'md:col-start-2')}>
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-accent">
              <span aria-hidden="true">{ICONS[capability.id]}</span>
              {capability.eyebrow}
            </span>
            <h2 className="mt-3 text-[26px] sm:text-[32px] leading-[1.15] font-semibold tracking-[-0.02em] text-fg">
              {capability.heading}
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-fg-2 max-w-[52ch]">
              {capability.body}
            </p>
          </div>

          <ul className={cn('space-y-3.5', flipped && 'md:col-start-1 md:row-start-1')}>
            {capability.points.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-0.5 grid place-items-center w-5 h-5 shrink-0 rounded-full bg-accent-weak text-accent"
                >
                  <Check size={12} strokeWidth={2.75} />
                </span>
                <span className="text-[14.5px] leading-snug text-fg-2">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
