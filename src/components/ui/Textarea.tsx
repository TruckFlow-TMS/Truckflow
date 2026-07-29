import React, { useId } from 'react';
import { cn } from '../../lib/cn';
import { FIELD_CLASS, fieldMsgId, FieldShell } from './Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label, hint, error, className, id, rows = 3, ...rest
}) => {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <FieldShell label={label} hint={hint} error={error} htmlFor={fieldId}>
      <textarea
        {...rest}
        id={fieldId}
        rows={rows}
        aria-describedby={(hint || error) ? fieldMsgId(fieldId) : undefined}
        aria-invalid={error ? true : undefined}
        className={cn(FIELD_CLASS, 'py-2 resize-y', error && 'border-danger', className)}
      />
    </FieldShell>
  );
};
