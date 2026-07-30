import React, { useState, useEffect, useMemo } from 'react';
import { AuditLogEntry } from '../../../types/tms';
import { mockStore } from '../../../services/mockStore';
import { DataTable, EmptyState, FilterBar, FilterSearch } from '../../ui';
import type { Column } from '../../ui';
import { ScrollText } from 'lucide-react';

export const AuditTab: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditSearch, setAuditSearch] = useState('');

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const logs = await mockStore.getAuditLogs();
      setAuditLogs(logs);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredLogs = useMemo(() => {
    return auditLogs
      .filter(log => (log.actorName + ' ' + log.action).toLowerCase().includes(auditSearch.toLowerCase()))
      .slice(0, 100);
  }, [auditLogs, auditSearch]);

  const columns: Column<AuditLogEntry>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      width: '16%',
      render: (log) => (
        <span className="text-fg-3 text-[11.5px] tnum">{new Date(log.timestamp).toLocaleString()}</span>
      ),
    },
    {
      key: 'actor',
      header: 'Actor',
      width: '16%',
      render: (log) => <span className="font-semibold text-accent">{log.actorName}</span>,
    },
    {
      key: 'action',
      header: 'Action',
      width: '18%',
      render: (log) => <span className="text-fg">{log.action}</span>,
    },
    {
      key: 'entityType',
      header: 'Entity type',
      width: '14%',
      render: (log) => <span className="text-fg-2">{log.entityType}</span>,
    },
    {
      key: 'details',
      header: 'Details',
      width: '36%',
      render: (log) => <span className="text-fg-3 truncate block">{log.details}</span>,
    },
  ];

  return (
    <div className="space-y-3.5">
      <DataTable
        columns={columns}
        rows={filteredLogs}
        rowKey={(log) => log.id}
        empty={
          <EmptyState
            icon={<ScrollText size={30} strokeWidth={1.5} />}
            title="No audit events found"
            sub="Try a different actor name or action."
          />
        }
        toolbar={
          <FilterBar
            search={
              <FilterSearch
                value={auditSearch}
                onChange={setAuditSearch}
                placeholder="Search actor name or action…"
                className="sm:w-[280px]"
              />
            }
          />
        }
      />
    </div>
  );
};
