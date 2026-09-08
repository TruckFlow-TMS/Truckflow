import React from 'react';
import { AUDIENCES } from './content';

export const WhoItsFor: React.FC = () => (
  <section id="who-its-for" className="py-16 sm:py-24 bg-surface-2 scroll-mt-16">
    <div className="mx-auto max-w-[1120px] px-5 sm:px-8">
      <div className="max-w-[46rem]">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-accent">
          Who it&rsquo;s for
        </span>
        <h2 className="mt-3 text-[26px] sm:text-[34px] leading-[1.15] font-semibold tracking-[-0.02em] text-fg">
          Built for carriers, not for freight brokers or 3PLs.
        </h2>
      </div>

      <div className="mt-10 sm:mt-14 divide-y divide-bd border-t border-bd">
        {AUDIENCES.map((audience) => (
          <div key={audience.heading} className="grid md:grid-cols-[13rem_1fr] gap-2 md:gap-10 py-7">
            <div>
              <h3 className="text-[16px] font-semibold text-fg leading-tight">
                {audience.heading}
              </h3>
              <p className="mt-1 text-[12.5px] font-medium text-fg-3 tabular-nums">
                {audience.size}
              </p>
            </div>
            <p className="text-[15px] leading-relaxed text-fg-2 max-w-[62ch]">{audience.body}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);
