import React, { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn';
import { FIELD_CLASS, FieldShell } from './Input';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
}

export const Select: React.FC<SelectProps> = ({
  label, hint, error, options, className, id, ...rest
}) => {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <FieldShell label={label} hint={hint} error={error} htmlFor={fieldId}>
      <div className="relative">
        <select
          {...rest}
          id={fieldId}
          className={cn(FIELD_CLASS, 'h-9 appearance-none cursor-pointer pr-8', error && 'border-danger', className)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-3 pointer-events-none"
        />
      </div>
    </FieldShell>
  );
};
