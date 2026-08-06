import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';
import { statusTone, humanizeStatus, TONE_CLASS } from './Badge';
import type { Tone } from './Badge';

/* ─── Status pill ────────────────────────────────────────────────────────────
   A status badge that is also the control for changing it. Reading a row and
   correcting it are the same gesture in day-to-day dispatch work — putting a
   truck into maintenance should not cost a trip through the edit form.

   The menu renders in a portal because table cells clip their overflow, and
   closes on scroll rather than trying to follow the trigger: the fixed
   coordinates are captured once at open time.
   ─────────────────────────────────────────────────────────────────────────── */

export interface StatusPillOption {
  value: string;
  /** Defaults to humanizeStatus(value). */
  label?: string;
}

export interface StatusPillProps {
  value: string;
  options: StatusPillOption[];
  onChange: (next: string) => void | Promise<void>;
  /** Names the record for screen readers, e.g. "TK-101". */
  subject: string;
  disabled?: boolean;
  className?: string;
}

const MENU_WIDTH = 176;

/** Solid swatch for the menu rows — TONE_CLASS is a tint, too pale for a 6px dot. */
const DOT: Record<Tone, string> = {
  pos: 'bg-pos', warn: 'bg-warn', violet: 'bg-violet',
  danger: 'bg-danger', neutral: 'bg-neutral', accent: 'bg-accent',
};

export const StatusPill: React.FC<StatusPillProps> = ({
  value, options, onChange, subject, disabled, className,
}) => {
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const close = useCallback(() => { setOpen(false); setPos(null); }, []);

  const toggle = () => {
    if (disabled || busy) return;
    if (open) return close();
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const height = options.length * 32 + 8;
    const below = window.innerHeight - r.bottom;
    setPos({
      top: below < height + 12 ? r.top - height - 4 : r.bottom + 4,
      // Clamped so a pill near the right edge does not push the menu offscreen.
      left: Math.min(r.left, window.innerWidth - MENU_WIDTH - 8),
    });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { close(); btnRef.current?.focus(); } };
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!menuRef.current?.contains(t) && !btnRef.current?.contains(t)) close();
    };
    // Deferred a frame: focusing the pill can make the scroll container nudge it
    // into view, and that scroll event would otherwise close the menu on the
    // very click that opened it.
    const raf = requestAnimationFrame(() => {
      // Capture phase — the pill sits inside a scrollable table body and the
      // menu's coordinates are frozen at open time, so a scroll would strand it.
      window.addEventListener('scroll', close, true);
      window.addEventListener('resize', close);
      window.addEventListener('keydown', onKey);
      document.addEventListener('mousedown', onDown);
    });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open, close]);

  const select = async (next: string) => {
    close();
    btnRef.current?.focus();
    if (next === value) return;
    setBusy(true);
    try {
      await onChange(next);
    } finally {
      setBusy(false);
    }
  };

  const tone = TONE_CLASS[statusTone(value)];

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        disabled={disabled || busy}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={
          // A disabled pill is a badge, not a control — do not promise an
          // action the reader cannot take.
          disabled
            ? `${subject} status: ${humanizeStatus(value)}`
            : `${subject} status: ${humanizeStatus(value)}. Change status`
        }
        className={cn(
          'inline-flex items-center gap-1.5 h-[22px] pl-2.5 pr-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap',
          'transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          tone,
          disabled ? 'cursor-default' : 'cursor-pointer hover:brightness-95 hover:shadow-btn',
          open && 'ring-2 ring-accent',
          className,
        )}
      >
        {busy
          ? <Loader2 size={9} className="animate-spin shrink-0" />
          : <span className="w-[5px] h-[5px] rounded-full bg-current shrink-0" />}
        {humanizeStatus(value)}
        {!disabled && <ChevronDown size={11} className="shrink-0 opacity-70" />}
      </button>

      {open && pos && createPortal(
        <div
          ref={menuRef}
          role="listbox"
          aria-label={`${subject} status`}
          style={{ top: pos.top, left: pos.left, width: MENU_WIDTH }}
          className="fixed z-50 p-1 rounded-card border border-bd bg-surface shadow-hero"
        >
          {options.map((o) => {
            const label = o.label ?? humanizeStatus(o.value);
            const active = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => select(o.value)}
                className={cn(
                  'w-full flex items-center gap-2 px-2 h-8 rounded-ctl text-[12.5px] text-left transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                  active ? 'font-semibold text-fg bg-surface-2' : 'text-fg-2 hover:bg-surface-2 hover:text-fg',
                )}
              >
                <span className={cn('w-[6px] h-[6px] rounded-full shrink-0', DOT[statusTone(o.value)])} />
                <span className="flex-1 truncate">{label}</span>
                {active && <Check size={13} className="text-accent shrink-0" />}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </>
  );
};
