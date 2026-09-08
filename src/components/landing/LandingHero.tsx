import React from 'react';
import { Button } from '../ui';
import { HERO } from './content';
import { LoadLifecycle } from './LoadLifecycle';

export interface LandingHeroProps {
  onSignIn: () => void;
  onSeeHow: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onSignIn, onSeeHow }) => (
  <section className="relative overflow-hidden">
    {/* A faint grid fading out at the edges — the same backdrop technique the
        login screen uses, drawn from tokens so it re-tints in dark. */}
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage:
          'linear-gradient(rgb(var(--bd) / 0.55) 1px, transparent 1px),' +
          'linear-gradient(90deg, rgb(var(--bd) / 0.55) 1px, transparent 1px)',
        backgroundSize: '56px 56px',
        maskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, #000 30%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, #000 30%, transparent 100%)',
      }}
    />

    <div className="relative mx-auto max-w-[1120px] px-5 sm:px-8 pt-16 pb-14 sm:pt-24 sm:pb-20">
      <div className="max-w-[46rem]">
        <h1 className="text-[34px] leading-[1.08] sm:text-[46px] lg:text-[56px] font-semibold tracking-[-0.03em] text-fg">
          {HERO.headline}
        </h1>
        <p className="mt-5 text-[15.5px] sm:text-[17px] leading-relaxed text-fg-2 max-w-[54ch]">
          {HERO.sub}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button onClick={onSeeHow} className="h-11 px-6 text-sm">
            {HERO.primaryCta}
          </Button>
          <Button variant="secondary" onClick={onSignIn} className="h-11 px-6 text-sm">
            {HERO.secondaryCta}
          </Button>
        </div>
      </div>

      <div className="mt-14 sm:mt-20">
        <LoadLifecycle />
      </div>
    </div>
  </section>
);
