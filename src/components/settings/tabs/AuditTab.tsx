import React, { useState, useEffect, useMemo } from 'react';
import { AuditLogEntry } from '../../../types/tms';
import { mockStore } from '../../../services/mockStore';
import { DataTable, EmptyState, FilterBar, FilterSearch, Modal, Badge } from '../../ui';
import type { Column } from '../../ui';
import { ScrollText, Lock, User, Clock, ShieldAlert } from 'lucide-react';

export const AuditTab: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

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
      .filter(log => (log.actorName + ' ' + log.action + ' ' + log.entityType + ' ' + log.details).toLowerCase().includes(auditSearch.toLowerCase()))
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
      render: (log) => <span className="text-fg font-medium">{log.action}</span>,
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
        onRowClick={(log) => setSelectedLog(log)}
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
                placeholder="Search actor name, action, or entity…"
                className="sm:w-[280px]"
              />
            }
          />
        }
      />

      {/* Audit Detail Modal */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title="Audit Log Entry Details"
          subtitle="Append-only immutable record"
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-ctl bg-surface-2 border border-bd">
              <div className="flex items-center gap-2 text-[12px] font-semibold text-fg">
                <Clock size={14} className="text-accent" />
                <span className="tnum">{new Date(selectedLog.timestamp).toLocaleString()}</span>
              </div>
              <Badge tone="violet" dot={false}>RLS Protected</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[12.5px]">
              <div className="p-3 rounded-ctl bg-surface-2 border border-bd space-y-1">
                <span className="text-[10.5px] text-fg-3 font-semibold uppercase tracking-wider block">Actor Name</span>
                <p className="font-semibold text-accent">{selectedLog.actorName}</p>
                <p className="text-[11px] text-fg-3 tnum">{selectedLog.actorEmail || 'System'}</p>
              </div>

              <div className="p-3 rounded-ctl bg-surface-2 border border-bd space-y-1">
                <span className="text-[10.5px] text-fg-3 font-semibold uppercase tracking-wider block">Action & Target</span>
                <p className="font-semibold text-fg">{selectedLog.action}</p>
                <p className="text-[11px] text-fg-2">{selectedLog.entityType} ({selectedLog.entityId})</p>
              </div>
            </div>

            <div className="p-3 rounded-ctl bg-surface-2 border border-bd space-y-1">
              <span className="text-[10.5px] text-fg-3 font-semibold uppercase tracking-wider block">Event Details</span>
              <p className="text-[12.5px] text-fg leading-relaxed font-mono bg-surface border border-bd rounded-ctl p-2.5 mt-1 select-all">
                {selectedLog.details}
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px] text-fg-3 pt-2 border-t border-bd tnum">
              <span>Event ID: {selectedLog.id}</span>
              <span>IP Address: {selectedLog.ipAddress || '127.0.0.1'}</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
