import React, { useState } from 'react';
import { Role, PermissionKey, PermissionGrant } from '../../../types/tms';
import { useAuth } from '../../../context/AuthContext';
import { mockStore } from '../../../services/mockStore';
import { useToast } from '../../ui/Toast';
import { Card, Badge, Button, Input, Modal, EmptyState } from '../../ui';
import { ConfirmModal } from '../../ui/ConfirmModal';
import { ShieldCheck, Plus, Edit2, Trash2, CheckSquare, Square, Lock, Key } from 'lucide-react';

interface RolesTabProps {
  roles: Role[];
  onReload: () => void;
}

const PERMISSION_GROUPS: { group: string; items: { key: PermissionKey; label: string }[] }[] = [
  {
    group: 'Freight Loads & Dispatch',
    items: [
      { key: 'loads.view', label: 'View loads' },
      { key: 'loads.create', label: 'Book & create loads' },
      { key: 'loads.edit', label: 'Edit load details' },
      { key: 'loads.delete', label: 'Delete loads' },
      { key: 'loads.assign', label: 'Assign drivers & equipment' },
      { key: 'loads.dispatch', label: 'Advance load statuses' },
      { key: 'loads.view_rates', label: 'View rates & financials' },
      { key: 'accessorials.approve', label: 'Approve accessorials' },
    ],
  },
  {
    group: 'Invoicing & Factoring',
    items: [
      { key: 'invoices.issue', label: 'Issue customer invoices' },
      { key: 'invoices.void', label: 'Void invoices' },
      { key: 'factoring.submit', label: 'Submit to factoring' },
      { key: 'settlements.approve', label: 'Approve driver settlements' },
      { key: 'settlements.pay', label: 'Process settlement payments' },
    ],
  },
  {
    group: 'Fleet & Operations',
    items: [
      { key: 'drivers.manage', label: 'Manage driver roster' },
      { key: 'fleet.manage', label: 'Manage trucks & trailers' },
      { key: 'customers.manage', label: 'Manage customers & brokers' },
    ],
  },
  {
    group: 'Admin & Governance',
    items: [
      { key: 'roles.manage', label: 'Manage roles & permissions' },
      { key: 'users.manage', label: 'Manage user accounts' },
      { key: 'tenant.settings', label: 'Manage company settings' },
      { key: 'audit.view', label: 'View audit logs' },
    ],
  },
];

export const RolesTab: React.FC<RolesTabProps> = ({ roles, onReload }) => {
  const { currentUser, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<Set<PermissionKey>>(new Set());

  const handleOpenCreateModal = () => {
    setEditingRole(null);
    setRoleName('');
    setRoleDescription('');
    // Default to basic view perms
    setSelectedPerms(new Set(['loads.view', 'drivers.manage', 'fleet.manage', 'customers.manage']));
    setShowModal(true);
  };

  const handleOpenEditModal = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description || '');
    const currentKeys = new Set<PermissionKey>(role.permissions.map(p => p.key));
    setSelectedPerms(currentKeys);
    setShowModal(true);
  };

  const togglePermission = (key: PermissionKey) => {
    setSelectedPerms(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleGroup = (keys: PermissionKey[]) => {
    const allSelected = keys.every(k => selectedPerms.has(k));
    setSelectedPerms(prev => {
      const next = new Set(prev);
      if (allSelected) {
        keys.forEach(k => next.delete(k));
      } else {
        keys.forEach(k => next.add(k));
      }
      return next;
    });
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !roleName.trim()) return;

    setIsSubmitting(true);
    try {
      const permissions: PermissionGrant[] = Array.from(selectedPerms).map(key => ({
        key,
        scope: 'all',
      }));

      const roleObj: Role = {
        id: editingRole ? editingRole.id : `role-${Date.now()}`,
        tenantId: currentUser.tenantId,
        name: roleName.trim(),
        description: roleDescription.trim(),
        isSystemOwner: editingRole ? editingRole.isSystemOwner : false,
        permissions,
      };

      await mockStore.createOrUpdateRole(roleObj, currentUser);
      showToast('success', `Role "${roleName}" saved successfully`);
      onReload();
      setShowModal(false);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!deletingRole || !currentUser) return;
    setIsSubmitting(true);
    try {
      await mockStore.deleteRole(deletingRole.id, currentUser);
      showToast('success', `Role "${deletingRole.name}" deleted`);
      onReload();
      setDeletingRole(null);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete role');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13.5px] text-fg-2">
          System and custom roles available to this workspace, with their granted permissions.
        </p>

        {isAdmin && (
          <Button icon={<Plus size={13} />} onClick={handleOpenCreateModal}>
            Add new role
          </Button>
        )}
      </div>

      {roles.length === 0 ? (
        <EmptyState
          icon={<Lock size={30} strokeWidth={1.5} />}
          title="No roles configured"
          sub="Roles are seeded automatically for new workspaces."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {roles.map((role) => (
            <Card
              key={role.id}
              onClick={() => handleOpenEditModal(role)}
              className="group cursor-pointer transition-all duration-200 hover:border-accent/50 hover:shadow-lift active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-fg text-[13.5px] group-hover:text-accent transition-colors">
                      {role.name}
                    </span>
                    {role.isSystemOwner ? (
                      <Badge tone="violet" dot={false}>System Owner</Badge>
                    ) : (
                      <Badge tone="accent" dot={false}>Custom Role</Badge>
                    )}
                  </div>
                  <p className="text-[12px] text-fg-2 mt-1">
                    {role.description || 'No description provided.'}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="w-8 h-8 rounded-ctl bg-accent-weak text-accent flex items-center justify-center">
                    <ShieldCheck size={16} />
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-bd flex items-center justify-between text-[11.5px]">
                <span className="text-fg-3 tnum flex items-center gap-1">
                  <Key size={12} className="text-accent" />
                  {role.permissions.length} permission{role.permissions.length === 1 ? '' : 's'} granted
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditModal(role);
                    }}
                    className="p-1 rounded text-fg-3 hover:text-accent hover:bg-surface-2 transition-colors"
                    title="Edit role"
                  >
                    <Edit2 size={13} />
                  </button>

                  {!role.isSystemOwner && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingRole(role);
                      }}
                      className="p-1 rounded text-fg-3 hover:text-danger hover:bg-surface-2 transition-colors"
                      title="Delete role"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Role Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingRole ? `Edit Role: ${editingRole.name}` : 'Create New Role'}
        subtitle="Define role name, description, and toggle granular system permissions."
        size="lg"
        busy={isSubmitting}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" form="role-form" loading={isSubmitting} disabled={!roleName.trim()}>
              {isSubmitting ? 'Saving…' : 'Save Role'}
            </Button>
          </>
        }
      >
        <form id="role-form" onSubmit={handleSaveRole} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Role Name *"
              required
              placeholder="e.g. Dispatch Manager, Billing Specialist"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              disabled={editingRole?.isSystemOwner}
            />
            <Input
              label="Description"
              placeholder="Brief summary of responsibilities"
              value={roleDescription}
              onChange={(e) => setRoleDescription(e.target.value)}
            />
          </div>

          <div className="border-t border-bd pt-3 space-y-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-fg-2 block">
              Granted Permissions ({selectedPerms.size} selected)
            </span>

            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
              {PERMISSION_GROUPS.map((grp) => {
                const groupKeys = grp.items.map(i => i.key);
                const allSelected = groupKeys.every(k => selectedPerms.has(k));

                return (
                  <div key={grp.group} className="rounded-ctl border border-bd bg-surface-2 p-3 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-bd pb-2">
                      <span className="text-[12px] font-bold text-fg">{grp.group}</span>
                      <button
                        type="button"
                        onClick={() => toggleGroup(groupKeys)}
                        className="text-[11px] font-semibold text-accent hover:underline flex items-center gap-1"
                      >
                        {allSelected ? 'Deselect group' : 'Select group'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {grp.items.map((item) => {
                        const isChecked = selectedPerms.has(item.key);
                        return (
                          <div
                            key={item.key}
                            onClick={() => togglePermission(item.key)}
                            className={`flex items-center gap-2.5 p-2 rounded-ctl border transition-all cursor-pointer select-none ${
                              isChecked
                                ? 'bg-surface border-accent/40 text-fg'
                                : 'bg-surface/50 border-bd text-fg-3 hover:border-bd-strong'
                            }`}
                          >
                            {isChecked ? (
                              <CheckSquare size={14} className="text-accent shrink-0" />
                            ) : (
                              <Square size={14} className="text-fg-3 shrink-0" />
                            )}
                            <span className="text-[12px] font-medium truncate">{item.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Role Confirmation Modal */}
      {deletingRole && (
        <ConfirmModal
          isOpen={!!deletingRole}
          title="Delete role"
          message={`Deleting the custom role "${deletingRole.name}" drops users holding it back to default permissions. This action cannot be undone.`}
          confirmPhrase={deletingRole.name}
          confirmNoun="role name"
          confirmLabel="Delete role"
          isDanger={true}
          onConfirm={handleDeleteRole}
          onCancel={() => setDeletingRole(null)}
          isLoading={isSubmitting}
        />
      )}
    </div>
  );
};
