import React from 'react';
import { Button, Wordmark } from '../ui';
import { FOOTER } from './content';

export interface LandingFooterProps {
  onSignIn: () => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({ onSignIn }) => (
  <>
    {/* The one full-width use of the gradient token. Holding it back everywhere
        else is what lets it carry the closing band on its own. */}
    <section className="bg-accent-grad">
      <div className="mx-auto max-w-[1120px] px-5 sm:px-8 py-16 sm:py-20">
        <div className="max-w-[42rem]">
          <h2 className="text-[26px] sm:text-[32px] leading-[1.15] font-semibold tracking-[-0.02em] text-on-hero">
            {FOOTER.heading}
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-on-hero/80 max-w-[52ch]">
            {FOOTER.body}
          </p>
          <Button
            variant="secondary"
            onClick={onSignIn}
            className="mt-8 h-11 px-6 text-sm bg-surface text-fg border-transparent hover:bg-surface-2 hover:text-fg focus-visible:ring-offset-0"
          >
            {FOOTER.cta}
          </Button>
        </div>
      </div>
    </section>

    <footer className="border-t border-bd bg-surface">
      <div className="mx-auto max-w-[1120px] px-5 sm:px-8 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Wordmark />
        <p className="text-[12.5px] text-fg-3">
          {FOOTER.legal} &copy; {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  </>
);
