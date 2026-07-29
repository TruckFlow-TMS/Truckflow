import React, { useState, useEffect, useMemo } from 'react';
import { AuditLogEntry } from '../../../types/tms';
import { mockStore } from '../../../services/mockStore';
import { DataTable, EmptyState } from '../../ui';
import type { Column } from '../../ui';
import { Search, ScrollText } from 'lucide-react';

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
          <div className="relative w-full sm:w-[280px]">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-3 pointer-events-none" />
            <input
              type="text"
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              placeholder="Search actor name or action…"
              className="w-full h-8 pl-8 pr-3 bg-surface-2 border border-bd rounded-ctl text-[12.5px] text-fg placeholder:text-fg-3 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
            />
          </div>
        }
      />
    </div>
  );
};
