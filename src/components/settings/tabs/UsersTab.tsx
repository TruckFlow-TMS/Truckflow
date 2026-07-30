import React, { useState, useMemo, useEffect } from 'react';
import { User } from '../../../types/tms';
import { useAuth } from '../../../context/AuthContext';
import { mockStore } from '../../../services/mockStore';
import { useToast } from '../../ui/Toast';
import { ConfirmModal } from '../../ui/ConfirmModal';
import {
  Button, Input, PasswordInput, Select, Modal, DataTable, Badge, Avatar,
  StatCard, EmptyState, FilterBar, FilterChips, FilterSearch,
  statusTone, humanizeStatus,
} from '../../ui';
import type { Column } from '../../ui';
import { cn } from '../../../lib/cn';
import {
  Users as UsersIcon, Plus, Edit2, Trash2, Calendar, Ban, AlertTriangle,
} from 'lucide-react';

interface UsersTabProps {
  onReload: () => void;
}

const ITEMS_PER_PAGE = 15;

const ROLE_OPTIONS = [
  { value: 'All', label: 'All roles' },
  { value: 'Admin', label: 'Admin' },
  { value: 'Dispatcher/User', label: 'Dispatcher' },
];

const STATUS_OPTIONS = [
  { value: 'All', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

const expirationTone = (dateString?: string | null) => {
  if (!dateString) return 'text-fg-3';
  const days = (new Date(dateString).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
  if (days < 0) return 'text-danger font-semibold';
  if (days <= 7) return 'text-danger font-semibold';
  if (days <= 14) return 'text-warn font-semibold';
  return 'text-fg-2';
};

export const UsersTab: React.FC<UsersTabProps> = ({ onReload }) => {
  const { currentUser, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<User | null>(null);

  const [deleteItem, setDeleteItem] = useState<User | null>(null);
  const [revokeItem, setRevokeItem] = useState<User | null>(null);
  const [renewItem, setRenewItem] = useState<User | null>(null);
  const [renewDate, setRenewDate] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  // Held outside formData because `User` carries no password — the store hashes
  // it server-side and never returns one, so it must not round-trip through the
  // record being edited.
  const [password, setPassword] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const allUsers = await mockStore.getUsers();
      setUsers(allUsers);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = (u.name + ' ' + u.email + ' ' + u.username).toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === 'All' || u.roleName === roleFilter;
      const matchStatus = statusFilter === 'All' || (u.isActive ? 'ACTIVE' : 'INACTIVE') === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE) || 1;
  // Clamped so a result set that shrinks under the current page (narrowed
  // filter, deleted row) falls back to the last real page instead of slicing
  // past the end and showing the empty state over rows that do exist.
  const page = Math.min(currentPage, totalPages);
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, page]);

  const kpiData = useMemo(() => {
    const active = users.filter(u => u.isActive).length;
    const admins = users.filter(u => u.roleName === 'Admin').length;
    return { total: users.length, active, admins };
  }, [users]);

  const expiringUsersCount = useMemo(() => {
    return users.filter(u => {
      if (!u.expirationDate) return false;
      const days = (new Date(u.expirationDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
      return days >= 0 && days <= 7;
    }).length;
  }, [users]);

  const handleOpenModal = (user?: User) => {
    setPassword('');
    if (user) {
      setEditItem(user);
      setFormData(user);
    } else {
      setEditItem(null);
      setFormData({
        roleName: 'Dispatcher/User',
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditItem(null);
    setFormData({});
    setPassword('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsLoading(true);
    try {
      if (editItem) {
        await mockStore.updateUser(editItem.id, formData, currentUser);
        showToast('success', 'User updated successfully');
      } else {
        // The dialog no longer asks for a handle — the full name is the display
        // identity and the email is the credential — but the store still keys
        // uniqueness on `username`, so it comes from the email's local part.
        const username = (formData.email || '').split('@')[0].toLowerCase();
        await mockStore.createUser({ ...formData, username, password } as any, currentUser);
        showToast('success', 'User created successfully');
      }
      fetchUsers();
      onReload();
      handleCloseModal();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to save user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUser || !deleteItem) return;
    if (deleteItem.id === currentUser.id) {
      showToast('error', 'Cannot delete yourself');
      setDeleteItem(null);
      return;
    }
    setIsLoading(true);
    try {
      await mockStore.deleteUser(deleteItem.id, currentUser);
      showToast('success', 'User deleted successfully');
      fetchUsers();
      onReload();
      setDeleteItem(null);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to delete user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!currentUser || !revokeItem) return;
    setIsLoading(true);
    try {
      await mockStore.declineUserAccess(revokeItem.id, currentUser);
      showToast('success', 'Access revoked');
      fetchUsers();
      onReload();
      setRevokeItem(null);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to revoke access');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenew = async () => {
    if (!currentUser || !renewItem || !renewDate) return;
    setIsLoading(true);
    try {
      await mockStore.renewUserExpiration(renewItem.id, renewDate, currentUser);
      showToast('success', 'Access renewed');
      fetchUsers();
      onReload();
      setRenewItem(null);
      setRenewDate('');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to renew access');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6 text-fg-3 text-[12.5px] italic">
        Permission denied. Only admins can view user management.
      </div>
    );
  }

  const columns: Column<User>[] = [
    {
      key: 'user',
      header: 'User details',
      width: '20%',
      render: (u) => (
        <span className="inline-flex items-center gap-2">
          <Avatar name={u.name} />
          <span>
            <span className="font-semibold">{u.name}</span>
            <span className="block text-[11px] text-fg-3 mt-px tnum">ID: {u.id}</span>
          </span>
        </span>
      ),
    },
    {
      key: 'email',
      header: 'Email address',
      width: '18%',
      render: (u) => <span className="tnum">{u.email}</span>,
    },
    {
      key: 'username',
      header: 'Username',
      width: '12%',
      render: (u) => <span className="font-semibold text-accent tnum">{u.username}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      width: '11%',
      render: (u) => (
        <Badge tone={u.roleName === 'Admin' ? 'violet' : 'accent'} dot={false}>
          {u.roleName}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '10%',
      render: (u) => (
        <Badge tone={statusTone(u.isActive ? 'ACTIVE' : 'INACTIVE')}>
          {humanizeStatus(u.isActive ? 'ACTIVE' : 'INACTIVE')}
        </Badge>
      ),
    },
    {
      key: 'expiration',
      header: 'Expiration date',
      width: '15%',
      render: (u) => (
        <span className={cn('tnum', expirationTone(u.expirationDate))}>
          {u.expirationDate ? new Date(u.expirationDate).toISOString().split('T')[0] : 'Permanent (no expiry)'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '14%',
      align: 'right',
      render: (u) => (
        <div className="flex items-center justify-end gap-0.5">
          <button
            onClick={() => handleOpenModal(u)}
            title="Edit"
            aria-label={`Edit ${u.name}`}
            className="p-1.5 rounded-ctl text-fg-3 hover:text-accent hover:bg-surface-2 transition-colors"
          >
            <Edit2 size={15} />
          </button>
          {u.expirationDate && (
            <button
              onClick={() => setRenewItem(u)}
              title="Renew access"
              aria-label={`Renew access for ${u.name}`}
              className="p-1.5 rounded-ctl text-pos hover:bg-surface-2 transition-colors"
            >
              <Calendar size={15} />
            </button>
          )}
          {u.isActive && (
            <button
              onClick={() => setRevokeItem(u)}
              title="Revoke access"
              aria-label={`Revoke access for ${u.name}`}
              className="p-1.5 rounded-ctl text-warn hover:bg-surface-2 transition-colors"
            >
              <Ban size={15} />
            </button>
          )}
          <button
            onClick={() => setDeleteItem(u)}
            title="Delete"
            aria-label={`Delete ${u.name}`}
            className="p-1.5 rounded-ctl text-fg-3 hover:text-danger hover:bg-surface-2 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-end">
        <Button icon={<Plus size={13} />} onClick={() => handleOpenModal()}>
          Add user account
        </Button>
      </div>

      {expiringUsersCount > 0 && (
        <div className="p-3.5 rounded-card bg-warn-bg border border-bd text-[12.5px] flex items-center gap-3">
          <AlertTriangle size={18} className="text-warn shrink-0" />
          <div className="text-fg">
            <span className="font-semibold tnum">{expiringUsersCount}</span> user account(s) have access
            expiring within the next 7 days. Review the roster below to renew or revoke.
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          variant="hero"
          label="Registered users"
          value={String(kpiData.total)}
          sub={`${kpiData.active} active · ${kpiData.total - kpiData.active} disabled`}
        />
        <StatCard label="System administrators" value={String(kpiData.admins)} sub="Full access role" />
        <StatCard
          variant="ring"
          ringPct={kpiData.total ? Math.round((kpiData.active / kpiData.total) * 1000) / 10 : 0}
          label="Active accounts"
          value={`${kpiData.total ? Math.round((kpiData.active / kpiData.total) * 1000) / 10 : 0}%`}
          sub="Currently able to sign in"
        />
        <StatCard
          label="Access expiring"
          value={String(expiringUsersCount)}
          sub={
            expiringUsersCount > 0
              ? <span className="text-warn font-semibold">Within 7 days</span>
              : 'No accounts lapsing soon'
          }
        />
      </div>

      <DataTable
        columns={columns}
        rows={paginatedUsers}
        rowKey={(u) => u.id}
        empty={
          <EmptyState
            icon={<UsersIcon size={30} strokeWidth={1.5} />}
            title="No users found"
            sub="Try a different role, status or search term."
            action={
              <Button icon={<Plus size={13} />} onClick={() => handleOpenModal()}>
                Add user account
              </Button>
            }
          />
        }
        toolbar={
          <FilterBar
            search={
              <FilterSearch
                value={search}
                onChange={(v) => { setSearch(v); setCurrentPage(1); }}
                placeholder="Search name, email, username…"
              />
            }
            extra={
              <FilterChips
                label="Filter users by role"
                value={roleFilter}
                onChange={(v) => { setRoleFilter(v); setCurrentPage(1); }}
                options={ROLE_OPTIONS}
              />
            }
            meta={`Showing ${paginatedUsers.length} of ${filteredUsers.length}`}
            chips={
              <FilterChips
                label="Filter users by status"
                value={statusFilter}
                onChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}
                options={STATUS_OPTIONS}
              />
            }
          />
        }
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-[12px] text-fg-2">
          <span className="tnum">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button
              variant="secondary" size="sm"
              disabled={page === 1}
              onClick={() => setCurrentPage(Math.max(1, page - 1))}
            >
              Previous
            </Button>
            <Button
              variant="secondary" size="sm"
              disabled={page === totalPages}
              onClick={() => setCurrentPage(Math.min(totalPages, page + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Add / Edit User Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editItem ? 'Edit user account' : 'Add new user account'}
        busy={isLoading}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit" form="user-form" loading={isLoading}>
              {isLoading ? 'Saving…' : 'Save user account'}
            </Button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Full name*"
              required
              value={formData.name || ''}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <Input
            label="Email address*"
            required
            type="email"
            value={formData.email || ''}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
          />
          <PasswordInput
            label={editItem ? 'New password' : 'Password*'}
            autoComplete="new-password"
            required={!editItem}
            placeholder={editItem ? '••••••••' : 'Set an initial password'}
            hint={editItem ? 'Leave blank to keep the current password' : undefined}
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <Select
            label="Role*"
            required
            value={formData.roleName || 'Dispatcher/User'}
            onChange={e => setFormData({ ...formData, roleName: e.target.value })}
            options={[
              { value: 'Dispatcher/User', label: 'Dispatcher/User' },
              { value: 'Admin', label: 'Admin' },
            ]}
          />
          <Input
            label="Expiration date (optional)"
            type="date"
            hint="Leave blank for permanent access"
            value={formData.expirationDate || ''}
            onChange={e => setFormData({ ...formData, expirationDate: e.target.value || undefined })}
          />
        </form>
      </Modal>

      {/* Renew Access Modal */}
      <Modal
        isOpen={!!renewItem}
        onClose={() => setRenewItem(null)}
        title="Renew user access"
        size="sm"
        busy={isLoading}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRenewItem(null)} disabled={isLoading}>Cancel</Button>
            <Button onClick={handleRenew} loading={isLoading} disabled={!renewDate}>
              Renew access
            </Button>
          </>
        }
      >
        <Input
          label="New expiration date*"
          type="date"
          value={renewDate}
          onChange={(e) => setRenewDate(e.target.value)}
        />
      </Modal>

      {revokeItem && (
        <ConfirmModal
          isOpen={!!revokeItem}
          title="Revoke user access"
          message={`Are you sure you want to revoke access for ${revokeItem.name}?`}
          isDanger={true}
          onConfirm={handleRevoke}
          onCancel={() => setRevokeItem(null)}
          isLoading={isLoading}
        />
      )}

      {deleteItem && (
        <ConfirmModal
          isOpen={!!deleteItem}
          title="Delete user account"
          message={`Are you sure you want to delete ${deleteItem.name}?`}
          isDanger={true}
          onConfirm={handleDelete}
          onCancel={() => setDeleteItem(null)}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};
