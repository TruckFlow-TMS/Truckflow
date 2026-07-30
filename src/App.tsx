import React, { useState, useEffect, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import { Header, Notification } from './components/layout/Header';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { LoginView } from './components/auth/LoginView';
import { DashboardView } from './components/dashboard/DashboardView';
import { DispatchBoardView } from './components/dispatch/DispatchBoardView';
import { LoadsListView } from './components/loads/LoadsListView';
import { LoadDetailModal } from './components/loads/LoadDetailModal';
import { CreateLoadModal } from './components/loads/CreateLoadModal';
import { AssignmentModal } from './components/loads/AssignmentModal';
import { DriversView } from './components/drivers/DriversView';
import { FleetView } from './components/fleet/FleetView';
import { CustomersView } from './components/customers/CustomersView';
import { BillingView } from './components/billing/BillingView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';

import { mockStore } from './services/mockStore';
import {
  Load,
  Driver,
  Equipment,
  Customer,
  Invoice,
  Role,
  AuditLogEntry,
  User,
} from './types/tms';

/** Read synchronously at mount so a collapsed reload doesn't flash open. */
const SIDEBAR_COLLAPSE_KEY = 'nune_tms_sidebar_collapsed';

export const AppContent: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Lives here rather than in Sidebar: the Header owns the toggle, so the two
  // need a common parent to share the flag.
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(
    () => localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === 'true',
  );

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSE_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Application Data States
  const [loads, setLoads] = useState<Load[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Dismissed notification IDs
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('nune_tms_dismissed_notis');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });
  const [readAll, setReadAll] = useState(false);

  // Modal States
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
  const [assigningLoad, setAssigningLoad] = useState<Load | null>(null);
  const [showCreateLoadModal, setShowCreateLoadModal] = useState(false);

  const reloadData = async () => {
    try {
      const [l, d, eq, cust, inv, r, u, audit] = await Promise.all([
        mockStore.getLoads(),
        mockStore.getDrivers(),
        mockStore.getEquipment(),
        mockStore.getCustomers(),
        mockStore.getInvoices(),
        mockStore.getRoles(),
        mockStore.getUsers(),
        mockStore.getAuditLogs(),
      ]);

      setLoads(l);
      setDrivers(d);
      setEquipment(eq);
      setCustomers(cust);
      setInvoices(inv);
      setRoles(r);
      setUsers(u);
      setAuditLogs(audit);

      if (selectedLoad) {
        const updated = l.find((x) => x.id === selectedLoad.id);
        if (updated) setSelectedLoad(updated);
      }
    } catch (err: any) {
      console.error('Failed to load data from store:', err);
    }
  };

  useEffect(() => {
    reloadData();
    mockStore.subscribe(reloadData);
  }, []);

  // Build notifications from data
  const notifications: Notification[] = useMemo(() => {
    const now = new Date();
    const notis: Notification[] = [];
    const isAdmin = currentUser?.roleName === 'Admin' || currentUser?.isOwner;

    // User expiration warnings (admin only)
    if (isAdmin) {
      users.forEach((u) => {
        if (!u.expirationDate) return;
        const diffTime = new Date(u.expirationDate).getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 0 && diffDays <= 7) {
          notis.push({
            id: `user-exp-${u.id}`,
            type: 'warning',
            title: 'Access Expiring Soon',
            message: `${u.name} (${u.username}) access expires in ${diffDays} day${diffDays !== 1 ? 's' : ''}.`,
            action: { label: 'Manage roster →', onClick: () => setActiveTab('settings') },
            read: readAll,
            timestamp: now,
          });
        }
      });
    }

    // Driver compliance alerts
    drivers.forEach((drv) => {
      if (!drv.cdlExpiration && !drv.medicalCardExpiration) return;
      const cdlDiff = drv.cdlExpiration
        ? (new Date(drv.cdlExpiration).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        : 999;
      const medDiff = drv.medicalCardExpiration
        ? (new Date(drv.medicalCardExpiration).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        : 999;

      if (cdlDiff < 30) {
        notis.push({
          id: `cdl-exp-${drv.id}`,
          type: 'danger',
          title: 'CDL Expiring',
          message: `${drv.name}'s CDL expires ${cdlDiff <= 0 ? 'today' : `in ${Math.ceil(cdlDiff)} days`} (${drv.cdlExpiration}).`,
          action: { label: 'View drivers →', onClick: () => setActiveTab('drivers') },
          read: readAll,
          timestamp: now,
        });
      }

      if (medDiff < 30) {
        notis.push({
          id: `med-exp-${drv.id}`,
          type: 'danger',
          title: 'Medical Card Expiring',
          message: `${drv.name}'s medical card expires ${medDiff <= 0 ? 'today' : `in ${Math.ceil(medDiff)} days`} (${drv.medicalCardExpiration}).`,
          action: { label: 'View drivers →', onClick: () => setActiveTab('drivers') },
          read: readAll,
          timestamp: now,
        });
      }
    });

    // Unassigned loads
    const unassigned = loads.filter((l) => !l.driverId && !['PAID', 'CANCELLED'].includes(l.status));
    if (unassigned.length > 0) {
      notis.push({
        id: 'unassigned-loads',
        type: 'info',
        title: 'Unassigned Loads',
        message: `${unassigned.length} load${unassigned.length !== 1 ? 's' : ''} need driver assignment.`,
        action: { label: 'Dispatch board →', onClick: () => setActiveTab('dispatch') },
        read: readAll,
        timestamp: now,
      });
    }

    // Filter out dismissed
    return notis.filter((n) => !dismissedIds.has(n.id));
  }, [users, drivers, loads, currentUser, dismissedIds, readAll]);

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem('nune_tms_dismissed_notis', JSON.stringify([...next]));
      return next;
    });
  };

  const handleMarkAllRead = () => setReadAll(true);

  // If user is unauthenticated, render Login View
  if (!currentUser) {
    return <LoginView />;
  }

  return (
    <div className="h-screen bg-canvas text-fg flex overflow-hidden selection:bg-accent selection:text-on-accent">
      {/* Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        loadCount={loads.length}
        collapsed={sidebarCollapsed}
      />

      {/* Main Right Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <Header
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
          notifications={notifications}
          onDismissNotification={handleDismiss}
          onMarkAllRead={handleMarkAllRead}
        />

        {/* Main View Area */}
        <main className="flex-1 p-5 overflow-y-auto w-full">
          {activeTab === 'dashboard' && (
            <DashboardView
              loads={loads}
              drivers={drivers}
              invoices={invoices}
              auditLogs={auditLogs}
              users={users}
              setActiveTab={setActiveTab}
              onOpenCreateLoad={() => setShowCreateLoadModal(true)}
              onSelectLoad={(ld) => setSelectedLoad(ld)}
              onReload={reloadData}
            />
          )}

          {activeTab === 'dispatch' && (
            <DispatchBoardView
              loads={loads}
              drivers={drivers}
              equipment={equipment}
              onSelectLoad={(ld) => setSelectedLoad(ld)}
              onOpenAssignModal={(ld) => setAssigningLoad(ld)}
              onOpenCreateLoad={() => setShowCreateLoadModal(true)}
              onReload={reloadData}
            />
          )}

          {activeTab === 'loads' && (
            <LoadsListView
              loads={loads}
              drivers={drivers}
              equipment={equipment}
              customers={customers}
              onReload={reloadData}
            />
          )}

          {activeTab === 'drivers' && <DriversView drivers={drivers} onReload={reloadData} />}

          {activeTab === 'fleet' && <FleetView equipment={equipment} drivers={drivers} onReload={reloadData} />}

          {activeTab === 'customers' && <CustomersView customers={customers} onReload={reloadData} />}

          {activeTab === 'invoices' && <BillingView invoices={invoices} loads={loads} customers={customers} onReload={reloadData} />}

          {activeTab === 'reports' && <ReportsView loads={loads} />}

          {activeTab === 'settings' && <SettingsView roles={roles} onReload={reloadData} />}
        </main>
      </div>

      {/* Global Modals */}
      {selectedLoad && (
        <LoadDetailModal
          load={selectedLoad}
          onClose={() => setSelectedLoad(null)}
          onReload={reloadData}
        />
      )}

      {assigningLoad && (
        <AssignmentModal
          isOpen={!!assigningLoad}
          load={assigningLoad}
          drivers={drivers}
          equipment={equipment}
          onClose={() => setAssigningLoad(null)}
          onReload={reloadData}
        />
      )}

      {showCreateLoadModal && (
        <CreateLoadModal
          isOpen={showCreateLoadModal}
          customers={customers}
          drivers={drivers}
          equipment={equipment}
          onClose={() => setShowCreateLoadModal(false)}
          onReload={reloadData}
        />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};
