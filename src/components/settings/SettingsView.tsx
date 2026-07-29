import React, { useState } from 'react';
import { Role } from '../../types/tms';
import { Button, PageHeader } from '../ui';
import { RolesTab } from './tabs/RolesTab';
import { UsersTab } from './tabs/UsersTab';
import { AuditTab } from './tabs/AuditTab';
import { PreferencesTab } from './tabs/PreferencesTab';

interface SettingsViewProps {
  roles: Role[];
  onReload: () => void;
}

type TabId = 'ROLES' | 'USERS' | 'AUDIT' | 'PREFERENCES';

const TABS: { id: TabId; label: string }[] = [
  { id: 'USERS', label: 'User roster & expirations' },
  { id: 'ROLES', label: 'Roles & permissions' },
  { id: 'AUDIT', label: 'Audit log stream' },
  { id: 'PREFERENCES', label: 'Company profile' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({ roles, onReload }) => {
  const [activeTab, setActiveTab] = useState<TabId>('USERS');

  return (
    <div className="space-y-3.5">
      <PageHeader
        title="Admin settings & roles management"
        subtitle="Manage user accounts, permission expirations, roles, company settings, and system audit logs."
      />

      <div className="flex flex-wrap gap-1 bg-surface-2 p-1 rounded-ctl border border-bd w-fit">
        {TABS.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === 'USERS' && <UsersTab onReload={onReload} />}
      {activeTab === 'ROLES' && <RolesTab roles={roles} onReload={onReload} />}
      {activeTab === 'AUDIT' && <AuditTab />}
      {activeTab === 'PREFERENCES' && <PreferencesTab />}
    </div>
  );
};
