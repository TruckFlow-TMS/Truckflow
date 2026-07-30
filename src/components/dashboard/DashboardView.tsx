import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Load, Driver, Invoice, AuditLogEntry, User } from '../../types/tms';
import {
  Button, Card, Badge, Avatar, StatCard, PageHeader, EmptyState,
  statusTone, humanizeStatus,
} from '../ui';
import {
  Truck,
  DollarSign,
  Clock,
  ShieldCheck,
  ArrowRight,
  Plus,
  Lock,
} from 'lucide-react';

interface DashboardViewProps {
  loads: Load[];
  drivers: Driver[];
  invoices: Invoice[];
  auditLogs: AuditLogEntry[];
  users: User[];
  setActiveTab: (tab: any) => void;
  onOpenCreateLoad: () => void;
  onSelectLoad: (load: Load) => void;
  onReload: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  loads,
  drivers,
  invoices,
  auditLogs,
  users,
  setActiveTab,
  onOpenCreateLoad,
  onSelectLoad,
  onReload,
}) => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.roleName === 'Admin' || currentUser?.isOwner;

  const now = new Date();

  const activeLoadsList = loads.filter((l) => ['OPEN', 'DISPATCHED', 'IN_TRANSIT'].includes(l.status));
  const activeLoadsCount = activeLoadsList.length;
  const inTransitCount = loads.filter((l) => l.status === 'IN_TRANSIT').length;
  const dispatchedCount = loads.filter((l) => l.status === 'DISPATCHED').length;

  const grossRevenueMinor = loads
    .filter((l) => ['PAID', 'INVOICED', 'DELIVERED', 'IN_TRANSIT'].includes(l.status))
    .reduce((sum, l) => sum + (l.rateMinor || 0), 0);

  const unassignedLoadsCount = loads.filter((l) => !l.driverId && l.status !== 'PAID').length;

  const complianceDrivers = drivers.filter(d => {
    if (!d.cdlExpiration && !d.medicalCardExpiration) return false;
    const cdlDiff = d.cdlExpiration ? (new Date(d.cdlExpiration).getTime() - now.getTime()) / (1000 * 60 * 60 * 24) : 999;
    const medDiff = d.medicalCardExpiration ? (new Date(d.medicalCardExpiration).getTime() - now.getTime()) / (1000 * 60 * 60 * 24) : 999;
    return cdlDiff < 60 || medDiff < 60;
  });

  return (
    <div className="space-y-3.5">
      <PageHeader
        title="Executive dispatch & fleet dashboard"
        subtitle="Nune Express LLC — real-time monitoring of active loads, driver assignments, rate confirm packets and factoring cash flows."
        actions={
          <>
            <Button
              variant="secondary"
              icon={<ArrowRight size={13} />}
              onClick={() => setActiveTab('dispatch')}
            >
              View dispatch board
            </Button>
            <Button icon={<Plus size={13} />} onClick={onOpenCreateLoad}>
              Book new load
            </Button>
          </>
        }
      />


      {/* 5 Executive KPI Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard
          label="Active loads"
          value={String(activeLoadsCount)}
          sub={<><span className="text-accent font-semibold">{inTransitCount} in transit</span> • {dispatchedCount} dispatched</>}
          onClick={() => setActiveTab('loads')}
        />

        <StatCard
          variant="hero"
          label="Gross revenue"
          value={`$${(grossRevenueMinor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          sub={`Across ${loads.length} loads`}
          spark={loads.slice(-8).map((l) => l.rateMinor)}
          onClick={() => setActiveTab('invoices')}
        />

        <StatCard
          variant="ring"
          ringPct={98.4}
          label="On-time delivery"
          value="98.4%"
          sub="Target >95% SLA"
          onClick={() => setActiveTab('reports')}
        />

        <StatCard
          label="Unassigned loads"
          value={String(unassignedLoadsCount)}
          sub={unassignedLoadsCount > 0 ? <span className="text-warn font-semibold">Requires driver assignment</span> : 'All covered'}
          onClick={() => setActiveTab('dispatch')}
        />

        <StatCard
          label="Compliance queue"
          value={String(complianceDrivers.length)}
          sub={complianceDrivers.length > 0 ? <span className="text-danger font-semibold">Expiring credentials</span> : 'All current'}
          onClick={() => setActiveTab('drivers')}
        />
      </div>

      {/* Main Grid: Active Stream & Compliance Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        {/* Left Column: Active Loads & Dispatch Stream */}
        <Card
          className="lg:col-span-2"
          header={
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[13.5px] font-semibold text-fg inline-flex items-center gap-2">
                <Truck size={15} className="text-accent" />
                <span>Active loads & dispatch stream</span>
              </h3>
              <button
                onClick={() => setActiveTab('loads')}
                className="text-[12px] text-accent hover:underline font-medium shrink-0"
              >
                View all loads ({loads.length}) &gt;
              </button>
            </div>
          }
        >
          <div className="space-y-3">
            {loads.slice(0, 5).map((ld) => (
              <div
                key={ld.id}
                onClick={() => onSelectLoad(ld)}
                className="p-3.5 rounded-ctl bg-surface border border-bd hover:border-accent/50 transition cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-semibold text-accent text-[13px] tnum group-hover:underline shrink-0">
                      {ld.loadNumber}
                    </span>
                    <Badge tone={statusTone(ld.status)}>{humanizeStatus(ld.status)}</Badge>
                    <span className="text-[12.5px] font-medium text-fg-2 truncate">{ld.brokerName}</span>
                  </div>
                  <span className="font-semibold text-[13px] text-fg tnum shrink-0">
                    ${(ld.rateMinor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 text-[12px] text-fg-2 bg-surface-2 border border-bd rounded-ctl px-3 py-2">
                  <span className="font-medium truncate">
                    {ld.originCity}, {ld.originState} → {ld.destCity}, {ld.destState}
                  </span>
                  <span className="text-fg-3 tnum shrink-0">{ld.loadedMiles} mi</span>
                  <span className="font-medium shrink-0">
                    Driver: <span className="text-accent font-semibold">{ld.driverName || 'Unassigned'}</span>
                  </span>
                </div>
              </div>
            ))}

            {loads.length === 0 && (
              <EmptyState
                icon={<Truck size={28} strokeWidth={1.5} />}
                title="No loads yet"
                sub="Book a load to see it appear in the dispatch stream."
              />
            )}
          </div>
        </Card>

        {/* Right Column: Compliance Alerts & Audit Stream */}
        <div className="space-y-3.5">
          {/* Compliance & Audit Alerts */}
          <Card
            header={
              <div
                onClick={() => setActiveTab('drivers')}
                className="flex items-center justify-between gap-3 cursor-pointer group"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveTab('drivers'); } }}
              >
                <h3 className="text-[13.5px] font-semibold text-fg inline-flex items-center gap-2">
                  <ShieldCheck size={15} className="text-danger" />
                  <span>Compliance & audit alerts</span>
                </h3>
                <span className="text-[11px] text-accent font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  View all &gt;
                </span>
              </div>
            }
          >
            <div className="space-y-2.5">
              {drivers.slice(0, 3).map((drv) => (
                <div
                  key={drv.id}
                  onClick={() => setActiveTab('drivers')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveTab('drivers'); } }}
                  className="p-3 rounded-ctl bg-surface-2 border border-bd space-y-1.5 cursor-pointer transition-all duration-200 hover:border-accent/40 hover:shadow-card active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-[12.5px] font-semibold text-fg truncate">{drv.name}</h4>
                      <p className="text-[10.5px] text-fg-3">({drv.employmentType})</p>
                    </div>
                    <Badge tone="danger">Expired/soon</Badge>
                  </div>

                  <div className="text-[10.5px] tnum text-fg-3 flex items-center justify-between pt-1.5 border-t border-bd">
                    <span>CDL exp: {drv.cdlExpiration || '2027-11-15'}</span>
                    <span>Med exp: {drv.medicalCardExpiration || '2026-08-10'}</span>
                  </div>
                </div>
              ))}

              {drivers.length === 0 && (
                <EmptyState
                  icon={<ShieldCheck size={28} strokeWidth={1.5} />}
                  title="No drivers on file"
                />
              )}
            </div>
          </Card>

          {/* Audit Stream Card */}
          <Card
            header={
              <div
                onClick={() => setActiveTab('settings')}
                className="flex items-center justify-between gap-3 cursor-pointer group"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveTab('settings'); } }}
              >
                <h3 className="text-[13.5px] font-semibold text-fg inline-flex items-center gap-2">
                  <Lock size={14} className="text-accent" />
                  <span>Append-only audit stream</span>
                </h3>
                <span className="text-[10.5px] font-semibold text-fg-3 group-hover:text-accent transition-colors">
                  RLS protected
                </span>
              </div>
            }
          >
            <div className="space-y-2.5">
              {auditLogs.slice(0, 4).map((log) => (
                <div
                  key={log.id}
                  onClick={() => setActiveTab('settings')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveTab('settings'); } }}
                  className="p-3 rounded-ctl bg-surface-2 border border-bd space-y-1 cursor-pointer transition-all duration-200 hover:border-accent/40 hover:shadow-card active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between text-[10.5px] text-fg-3 tnum">
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span className="text-accent font-semibold">{log.actorName}</span>
                  </div>
                  <p className="text-fg font-medium text-[12px]">{log.action} on {log.entityType}</p>
                  <p className="text-fg-3 text-[10.5px] truncate">{log.details}</p>
                </div>
              ))}

              {auditLogs.length === 0 && (
                <EmptyState
                  icon={<Lock size={28} strokeWidth={1.5} />}
                  title="No audit activity yet"
                />
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
