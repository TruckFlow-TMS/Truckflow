import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import { Header } from './components/layout/Header';
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

export const AppContent: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Application Data States
  const [loads, setLoads] = useState<Load[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

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

  // If user is unauthenticated, render Login View
  if (!currentUser) {
    return <LoginView />;
  }

  return (
    <div className="h-screen bg-canvas text-fg flex overflow-hidden selection:bg-accent selection:text-on-accent">
      {/* Left Navigation Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} loadCount={loads.length} />

      {/* Main Right Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <Header onOpenCreateLoad={() => setShowCreateLoadModal(true)} />

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
