import React, { useCallback } from 'react';
import { CAPABILITIES, PROBLEM } from './content';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';
import { LandingHeader } from './LandingHeader';
import { LandingHero } from './LandingHero';
import { CapabilitySection } from './CapabilitySection';
import { HowItWorks } from './HowItWorks';
import { WhoItsFor } from './WhoItsFor';
import { LandingFooter } from './LandingFooter';

export interface LandingViewProps {
  onSignIn: () => void;
}

/**
 * The logged-out entry point. Reads no store and makes no network call —
 * `onSignIn` is its only outward edge, handing back to LoginView.
 */
export const LandingView: React.FC<LandingViewProps> = ({ onSignIn }) => {
  const reducedMotion = usePrefersReducedMotion();

  const scrollTo = useCallback(
    (id: string) => {
      document.getElementById(id)?.scrollIntoView({
        behavior: reducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    },
    [reducedMotion],
  );

  return (
    <div className="min-h-screen bg-canvas text-fg selection:bg-accent selection:text-on-accent">
      <LandingHeader onSignIn={onSignIn} onNavigate={scrollTo} />

      <main>
        <LandingHero onSignIn={onSignIn} onSeeHow={() => scrollTo('how-it-works')} />

        {/* Type-only band. The absence of a card or an icon here is the point —
            it gives the capability sections below something to land against. */}
        <section className="bg-surface-2 border-y border-bd">
          <div className="mx-auto max-w-[1120px] px-5 sm:px-8 py-14 sm:py-20">
            <div className="max-w-[62ch]">
              <h2 className="text-[24px] sm:text-[30px] leading-[1.2] font-semibold tracking-[-0.02em] text-fg">
                {PROBLEM.heading}
              </h2>
              <p className="mt-4 text-[15.5px] leading-relaxed text-fg-2">{PROBLEM.body}</p>
            </div>
          </div>
        </section>

        <div id="product" className="scroll-mt-16">
          {CAPABILITIES.map((capability, i) => (
            <CapabilitySection key={capability.id} capability={capability} index={i} />
          ))}
        </div>

        <HowItWorks />
        <WhoItsFor />
      </main>

      <LandingFooter onSignIn={onSignIn} />
    </div>
  );
};
