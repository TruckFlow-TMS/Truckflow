import React from 'react';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  sub?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, sub, action }) => (
  <div className="flex flex-col items-center justify-center py-14 text-center">
    <span className="text-fg-3 mb-3">{icon ?? <Inbox size={30} strokeWidth={1.5} />}</span>
    <p className="text-[13.5px] font-medium text-fg-2">{title}</p>
    {sub && <p className="text-[12px] text-fg-3 mt-1 max-w-sm">{sub}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
