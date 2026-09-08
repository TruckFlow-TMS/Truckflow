import React from 'react';
import { LIFECYCLE } from './content';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

/** Geometry of the horizontal rail, in the 1080-wide viewBox. */
const RAIL_Y = 92;
const FIRST_X = 90;
const GAP = 180;
const nodeX = (i: number) => FIRST_X + i * GAP;
const RAIL_D = `M ${nodeX(0)} ${RAIL_Y} L ${nodeX(LIFECYCLE.length - 1)} ${RAIL_Y}`;

const SEQUENCE = LIFECYCLE.map((s) => s.label.toLowerCase()).join(', ');
const DESCRIPTION = `Load lifecycle: ${SEQUENCE}.`;

/**
 * The load lifecycle as the product actually models it — the six columns of the
 * dispatch board, each annotated with the document that stage produces.
 *
 * This describes the domain rather than the interface, which is why it stands in
 * for product screenshots: the six stages stay true while the UI is still moving.
 * Every colour is a token, so it re-tints in dark without a `dark:` variant.
 */
export const LoadLifecycle: React.FC = () => {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div className="w-full">
      {/* Horizontal rail — md and up. */}
      <svg
        role="img"
        aria-label={DESCRIPTION}
        viewBox="0 0 1080 176"
        fill="none"
        className="hidden md:block w-full h-auto"
      >
        <path d={RAIL_D} stroke="rgb(var(--bd-strong))" strokeWidth="1.5" strokeLinecap="round" />

        {/* Dashes drifting toward the paid end, so the rail reads directionally. */}
        <path
          id="lifecycle-rail"
          d={RAIL_D}
          stroke="rgb(var(--accent) / 0.55)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="10 14"
          className="animate-lane"
          style={{ animationDuration: '9s' }}
        />

        {!reducedMotion && (
          <>
            <circle r="9" fill="rgb(var(--accent) / 0.16)" aria-hidden="true">
              <animateMotion dur="9s" repeatCount="indefinite">
                <mpath href="#lifecycle-rail" />
              </animateMotion>
            </circle>
            <circle r="3.5" fill="rgb(var(--accent))" aria-hidden="true">
              <animateMotion dur="9s" repeatCount="indefinite">
                <mpath href="#lifecycle-rail" />
              </animateMotion>
            </circle>
          </>
        )}

        {LIFECYCLE.map((stage, i) => {
          const x = nodeX(i);
          const isLast = i === LIFECYCLE.length - 1;
          return (
            <g key={stage.status} aria-hidden="true">
              <text
                x={x}
                y={RAIL_Y - 40}
                textAnchor="middle"
                fill="rgb(var(--fg))"
                fontSize="14.5"
                fontWeight="600"
                letterSpacing="-0.01em"
              >
                {stage.label}
              </text>

              <circle cx={x} cy={RAIL_Y} r="17" fill="rgb(var(--surface))" />
              <circle
                cx={x}
                cy={RAIL_Y}
                r="17"
                fill={isLast ? 'rgb(var(--accent))' : 'transparent'}
                stroke={isLast ? 'rgb(var(--accent))' : 'rgb(var(--bd-strong))'}
                strokeWidth="1.5"
              />
              <text
                x={x}
                y={RAIL_Y + 4.5}
                textAnchor="middle"
                fill={isLast ? 'rgb(var(--on-hero))' : 'rgb(var(--fg-2))'}
                fontSize="12"
                fontWeight="600"
              >
                {i + 1}
              </text>

              <text
                x={x}
                y={RAIL_Y + 46}
                textAnchor="middle"
                fill="rgb(var(--fg-3))"
                fontSize="11.5"
              >
                {stage.artifact}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Vertical stack — below md, where six columns of text cannot breathe. */}
      <ol className="md:hidden space-y-0" aria-label={DESCRIPTION}>
        {LIFECYCLE.map((stage, i) => {
          const isLast = i === LIFECYCLE.length - 1;
          return (
            <li key={stage.status} className="flex gap-3.5">
              <div className="flex flex-col items-center">
                <span
                  className={
                    isLast
                      ? 'grid place-items-center w-7 h-7 shrink-0 rounded-full text-[11.5px] font-semibold bg-accent text-on-hero'
                      : 'grid place-items-center w-7 h-7 shrink-0 rounded-full text-[11.5px] font-semibold border border-bd-strong text-fg-2'
                  }
                >
                  {i + 1}
                </span>
                {!isLast && <span aria-hidden="true" className="w-px flex-1 bg-bd-strong my-1" />}
              </div>
              <div className={isLast ? 'pb-0' : 'pb-5'}>
                <p className="text-[14px] font-semibold text-fg leading-tight">{stage.label}</p>
                <p className="text-[12px] text-fg-3 mt-0.5">{stage.artifact}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
