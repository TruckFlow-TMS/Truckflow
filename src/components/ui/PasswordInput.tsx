import React, { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/cn';
import { FieldShell, FIELD_CLASS, fieldMsgId } from './Input';

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  hint?: string;
  error?: string;
}

/**
 * Password field with a reveal toggle. Built on FieldShell so the label, hint
 * and error render exactly as they do for Input — the only difference is the
 * button inside the field.
 */
export const PasswordInput: React.FC<PasswordInputProps> = ({
  label, hint, error, className, id, ...rest
}) => {
  const auto = useId();
  const fieldId = id ?? auto;
  const [visible, setVisible] = useState(false);

  return (
    <FieldShell label={label} hint={hint} error={error} htmlFor={fieldId}>
      <div className="relative">
        <input
          {...rest}
          id={fieldId}
          type={visible ? 'text' : 'password'}
          aria-describedby={(hint || error) ? fieldMsgId(fieldId) : undefined}
          aria-invalid={error ? true : undefined}
          className={cn(FIELD_CLASS, 'h-9 pr-9', error && 'border-danger', className)}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          // The label states the action, not the state — a screen reader user
          // gets no benefit from "password shown" on a control they press to
          // change it. aria-pressed carries the state instead.
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className={cn(
            'absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-ctl',
            'text-fg-3 hover:text-fg hover:bg-surface-2 transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          )}
        >
          {visible ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
        </button>
      </div>
    </FieldShell>
  );
};
