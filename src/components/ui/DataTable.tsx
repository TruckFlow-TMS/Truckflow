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
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full border-collapse table-fixed">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    style={{ width: c.width }}
                    className={cn(
                      'sticky top-0 z-10 text-[11.5px] font-semibold text-fg-2 px-3.5 py-2.5 bg-surface-2',
                      'border-b border-bd whitespace-nowrap tracking-wide truncate',
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
                  tabIndex={onRowClick ? 0 : undefined}
                  // Deliberately NOT role="button": that overrides the implicit
                  // `row` role and drops the cells out of the table for screen
                  // readers, costing far more than the click affordance gains.
                  // The row keeps its table semantics and simply becomes
                  // focusable and Enter/Space-activatable.
                  onKeyDown={onRowClick ? (e) => {
                    if (e.currentTarget !== e.target) return; // let cell controls keep their keys
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onRowClick(row);
                    }
                  } : undefined}
                  className={cn(
                    'border-b border-bd last:border-b-0 transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent',
                  )}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        // Cells can render multi-line content: a primary value with a
                        // `block` sub-line beneath it (e.g. load number + miles). Tailwind's
                        // `truncate` bundles `white-space: nowrap` in with the overflow
                        // clipping, and nowrap is inherited into the sub-line's text — on
                        // long values that forces the second line to run wide and clip
                        // (or renders with no ellipsis of its own, since `text-overflow`
                        // only ever applies to the <td>'s own line box, not nested block
                        // children). Clipping vertical/horizontal overflow on the cell
                        // without forcing nowrap keeps two-line cells intact; row height is
                        // fixed (h-[50px]) so runaway content is still clipped, just without
                        // forcing a single line.
                        'px-3.5 h-[50px] text-[13.5px] text-fg align-middle overflow-hidden',
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
