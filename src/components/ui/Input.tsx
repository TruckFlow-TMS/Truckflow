import React, { useId } from 'react';
import { cn } from '../../lib/cn';

/** Shared by Input, Select and Textarea so the three cannot drift apart. */
export const FIELD_CLASS =
  'w-full bg-surface-2 border border-bd rounded-ctl text-fg placeholder:text-fg-3 ' +
  'text-[13px] px-3 transition-colors ' +
  'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

export interface FieldShellProps {
  label?: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
}

/**
 * Id of the error/hint message paragraph for a given field id.
 * Shared by Input, Select and Textarea so they all wire up
 * aria-describedby the same way instead of duplicating the logic.
 */
export const fieldMsgId = (htmlFor?: string): string | undefined =>
  htmlFor ? `${htmlFor}-msg` : undefined;

/** Label above, error/hint below — the layout every field shares. */
export const FieldShell: React.FC<FieldShellProps> = ({ label, hint, error, htmlFor, children }) => (
  <div className="w-full">
    {label && (
      <label htmlFor={htmlFor} className="block text-[11.5px] font-medium text-fg-2 mb-1.5">
        {label}
      </label>
    )}
    {children}
    {error ? (
      <p id={fieldMsgId(htmlFor)} className="text-[11px] text-danger mt-1">{error}</p>
    ) : hint ? (
      <p id={fieldMsgId(htmlFor)} className="text-[11px] text-fg-3 mt-1">{hint}</p>
    ) : null}
  </div>
);

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, hint, error, className, id, ...rest }) => {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <FieldShell label={label} hint={hint} error={error} htmlFor={fieldId}>
      <input
        {...rest}
        id={fieldId}
        aria-describedby={(hint || error) ? fieldMsgId(fieldId) : undefined}
        aria-invalid={error ? true : undefined}
        className={cn(FIELD_CLASS, 'h-9', error && 'border-danger', className)}
      />
    </FieldShell>
  );
};
