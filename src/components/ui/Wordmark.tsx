import React from 'react';
import { Truck } from 'lucide-react';
import { cn } from '../../lib/cn';

export type WordmarkTone =
  /** Normal surfaces — themed by tokens. */
  | 'default'
  /** The accent gradient band, where the palette inverts. */
  | 'onHero'
  /** The sidebar rail, which is theme-invariant navy. */
  | 'sidebar';

export interface WordmarkProps {
  tone?: WordmarkTone;
  /** Hides the text, leaving only the mark — for the collapsed sidebar rail. */
  markOnly?: boolean;
  className?: string;
}

/**
 * The TruckHQ wordmark, set in type rather than drawn from `public/logo.png`.
 *
 * That asset is the previous Nune HQ logo and carries its tagline inside the
 * artwork, so it cannot be re-lettered in code. Setting the mark in type is what
 * lets the whole app carry one name until new artwork exists.
 */
export const Wordmark: React.FC<WordmarkProps> = ({
  tone = 'default',
  markOnly = false,
  className,
}) => {
  const tile =
    tone === 'onHero'
      ? 'bg-on-hero/15 text-on-hero'
      : tone === 'sidebar'
        ? 'bg-accent-grad text-on-hero'
        : 'bg-accent-grad text-on-hero shadow-btn';

  const word =
    tone === 'onHero' ? 'text-on-hero' : tone === 'sidebar' ? 'text-side-fg-on' : 'text-fg';

  const hq =
    tone === 'onHero'
      ? 'text-on-hero/70'
      : tone === 'sidebar'
        ? 'text-side-active'
        : 'text-accent';

  return (
    <span className={cn('inline-flex items-center gap-2.5 select-none', className)}>
      <span
        aria-hidden="true"
        className={cn('grid place-items-center w-8 h-8 shrink-0 rounded-[9px]', tile)}
      >
        <Truck size={17} strokeWidth={2.1} />
      </span>
      {!markOnly && (
        <span className={cn('text-[17px] font-semibold tracking-[-0.02em]', word)}>
          Truck<span className={hq}>HQ</span>
        </span>
      )}
    </span>
  );
};
