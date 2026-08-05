import React from 'react';
import { cn } from '../../lib/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  padded = true,
  header,
  footer,
  className,
  children,
  ...rest
}) => (
  <div
    {...rest}
    className={cn('bg-surface border border-bd rounded-card shadow-card transition-all duration-200 hover:border-accent/40', className)}
  >
    {header && <div className="px-4 py-3 border-b border-bd">{header}</div>}
    <div className={cn(padded && 'p-4')}>{children}</div>
    {footer && <div className="px-4 py-3 border-t border-bd">{footer}</div>}
  </div>
);
