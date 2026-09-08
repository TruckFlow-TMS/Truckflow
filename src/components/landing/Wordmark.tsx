import React from 'react';
import { Truck } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface WordmarkProps {
  /** Renders on the gradient closing band, where the palette inverts. */
  onHero?: boolean;
  className?: string;
}

/**
 * A typographic wordmark rather than `public/logo.png`.
 *
 * That asset is the Nune HQ logo and carries its tagline in the artwork; this
 * page is branded TruckHQ, so shipping the image here would put two names on
 * one screen. Renaming the in-app branding is deliberately out of scope, so the
 * landing page sets its own mark in type.
 */
export const Wordmark: React.FC<WordmarkProps> = ({ onHero = false, className }) => (
  <span className={cn('inline-flex items-center gap-2.5 select-none', className)}>
    <span
      aria-hidden="true"
      className={cn(
        'grid place-items-center w-8 h-8 rounded-[9px]',
        onHero ? 'bg-on-hero/15 text-on-hero' : 'bg-accent-grad text-on-hero shadow-btn',
      )}
    >
      <Truck size={17} strokeWidth={2.1} />
    </span>
    <span
      className={cn(
        'text-[17px] font-semibold tracking-[-0.02em]',
        onHero ? 'text-on-hero' : 'text-fg',
      )}
    >
      Truck<span className={onHero ? 'text-on-hero/70' : 'text-accent'}>HQ</span>
    </span>
  </span>
);
