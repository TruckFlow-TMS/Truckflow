import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';

/** Elements that can hold focus inside the dialog. */
const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), ' +
  'select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Preferred landing spot on open. The first focusable element is the header's
 * close button, which is a poor place to arrive in a form dialog — the point of
 * opening it is to type. A data entry control is the better target when the
 * dialog has one; confirmations have none and keep the close button, which is
 * also the least destructive choice for them.
 */
const FIRST_FIELD =
  'input:not([disabled]), textarea:not([disabled]), select:not([disabled])';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** When true, backdrop click / Escape / header close button will not dismiss the modal. */
  busy?: boolean;
  children: React.ReactNode;
}

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen, onClose, title, subtitle, footer, size = 'md', busy = false, children,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // Esc closes; Tab is trapped inside the panel; body does not scroll behind.
  // Without the trap, `aria-modal` hides the page from screen readers while
  // keyboard focus still walks out into it — the user ends up driving controls
  // the backdrop is visually covering and the mouse cannot reach.
  // Kept apart from the key handler below on purpose. `onClose` is an inline
  // arrow at almost every call site, so it gets a fresh identity on every
  // render of the parent — which means every keystroke in a field. Bundled
  // together, that re-ran this effect mid-typing: the cleanup handed focus back
  // to the trigger and the setup grabbed it again for the first control, so the
  // caret jumped to the close button on each character. Depending on `isOpen`
  // alone pins focus work to open and close, where it belongs.
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Remember where focus came from so it can be handed back on close.
    const restoreTo = document.activeElement as HTMLElement | null;
    // First field, else first focusable, else the panel itself.
    const panel = panelRef.current;
    const target =
      panel?.querySelector<HTMLElement>(FIRST_FIELD) ??
      panel?.querySelector<HTMLElement>(FOCUSABLE);
    (target ?? panel)?.focus();

    return () => {
      document.body.style.overflow = prevOverflow;
      restoreTo?.focus?.();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
        .filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (items.length === 0) {
        // Nothing focusable inside — keep focus on the panel rather than
        // letting Tab escape to the page behind.
        e.preventDefault();
        panel.focus();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose, busy]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={busy ? undefined : onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'w-full bg-surface border border-bd rounded-card shadow-lift',
          'max-h-[90vh] flex flex-col focus:outline-none',
          SIZES[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-bd shrink-0">
          <div>
            <h2 id={titleId} className="text-[15px] font-semibold text-fg tracking-tight">{title}</h2>
            {subtitle && <p className="text-[12px] text-fg-2 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="p-1.5 -m-1 rounded-ctl text-fg-3 hover:text-fg hover:bg-surface-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-fg-3"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div className="px-5 py-4 border-t border-bd flex items-center justify-end gap-2.5 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
