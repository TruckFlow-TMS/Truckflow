import React from 'react';
import { LIFECYCLE } from './content';

/**
 * The same six stages as the hero diagram, restated in prose. That redundancy is
 * deliberate: it is what lets the diagram stay a picture rather than the only
 * place this information exists.
 */
export const HowItWorks: React.FC = () => (
  <section id="how-it-works" className="py-16 sm:py-24 scroll-mt-16">
    <div className="mx-auto max-w-[1120px] px-5 sm:px-8">
      <div className="max-w-[46rem]">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-accent">
          How it works
        </span>
        <h2 className="mt-3 text-[26px] sm:text-[34px] leading-[1.15] font-semibold tracking-[-0.02em] text-fg">
          A load moves through six stages, and each one leaves a document behind.
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-fg-2 max-w-[54ch]">
          These are the dispatch board&rsquo;s actual columns. A load sits in exactly one of them
          at any moment, so &ldquo;where is that load?&rdquo; has a single answer rather than a
          phone call.
        </p>
      </div>

      <ol className="mt-10 sm:mt-14 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {LIFECYCLE.map((stage, i) => (
          <li key={stage.status} className="flex gap-4">
            <span className="text-[13px] font-semibold text-fg-3 tabular-nums pt-0.5">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="border-l border-bd pl-4">
              <h3 className="text-[15.5px] font-semibold text-fg leading-tight">{stage.label}</h3>
              <p className="mt-1.5 text-[13.5px] text-fg-3 leading-snug">{stage.artifact}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  </section>
);
