import React from 'react';
import { cn } from '../../lib/cn';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  /** CSS width, e.g. '16%' or '120px' */
  width?: string;
  align?: 'left' | 'right';
  render: (row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  empty?: React.ReactNode;
  toolbar?: React.ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns, rows, rowKey, onRowClick, empty, toolbar, className,
}: DataTableProps<T>) {
  return (
    <div className={cn('bg-surface border border-bd rounded-card shadow-card overflow-hidden', className)}>
      {toolbar && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-bd flex-wrap">
          {toolbar}
        </div>
      )}

      {rows.length === 0 ? (
        empty ?? <EmptyState title="Nothing to show" sub="Try clearing your filters." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    style={{ width: c.width }}
                    className={cn(
                      'text-[11.5px] font-semibold text-fg-2 px-3.5 py-2.5 bg-surface-2',
                      'border-b border-bd whitespace-nowrap tracking-wide',
                      c.align === 'right' ? 'text-right' : 'text-left',
                    )}
                  >
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'border-b border-bd last:border-b-0 transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-surface-2',
                  )}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        'px-3.5 h-[50px] text-[13.5px] text-fg align-middle',
                        c.align === 'right' && 'text-right font-semibold tnum',
                      )}
                    >
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
