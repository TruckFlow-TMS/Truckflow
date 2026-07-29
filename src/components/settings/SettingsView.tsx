import React, { useState, useMemo, useEffect } from 'react';
import { User, Role } from '../../types/tms';
import { useAuth } from '../../context/AuthContext';
import { mockStore } from '../../services/mockStore';
import { useToast } from '../ui/Toast';
import { ConfirmModal } from '../ui/ConfirmModal';
import { Settings, Search, Plus, Edit2, Trash2, Filter, AlertTriangle, Calendar, ShieldCheck, Ban, Lock, Building } from 'lucide-react';

interface SettingsViewProps {
  roles: Role[];
  onReload: () => void;
}

const ITEMS_PER_PAGE = 15;

export const SettingsView: React.FC<SettingsViewProps> = ({ roles, onReload }) => {
  const { currentUser, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'USER_MGMT' | 'COMPANY' | 'AUDIT'>('USER_MGMT');

  // User Management State
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

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditSearch, setAuditSearch] = useState('');

  // Initial Data Fetch
  useEffect(() => {
    fetchUsers();
    if (activeTab === 'AUDIT') fetchAuditLogs();
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      const allUsers = await mockStore.getUsers();
      setUsers(allUsers);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const logs = await mockStore.getAuditLogs();
      setAuditLogs(logs);
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

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

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
    if (user) {
      setEditItem(user);
      setFormData(user);
    } else {
      setEditItem(null);
      setFormData({
        roleName: 'Dispatcher/User',
        isActive: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditItem(null);
    setFormData({});
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
        await mockStore.createUser(formData as any, currentUser);
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

  const getExpirationDaysStyle = (dateString?: string | null) => {
    if (!dateString) return 'text-slate-500 dark:text-slate-400 font-mono';
    const days = (new Date(dateString).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
    if (days < 0) return 'text-rose-600 dark:text-rose-400 font-bold font-mono';
    if (days <= 7) return 'text-rose-600 dark:text-rose-400 font-extrabold font-mono';
    if (days <= 14) return 'text-amber-600 dark:text-amber-400 font-bold font-mono';
    return 'text-slate-700 dark:text-slate-300 font-mono';
  };

  if (!isAdmin && activeTab === 'USER_MGMT') {
    return <div className="p-6 text-slate-500 text-xs italic">Permission Denied. Only Admins can view Settings.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Admin Settings & Roles Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage user accounts, optional permission expiration dates, company settings, & system audit logs.
          </p>
        </div>

        {activeTab === 'USER_MGMT' && (
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center space-x-1.5 self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>+ Add User Account</span>
          </button>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 space-x-1 w-fit">
        <button 
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'USER_MGMT' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          onClick={() => setActiveTab('USER_MGMT')}
        >
          User Roster & Expirations
        </button>
        <button 
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'COMPANY' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          onClick={() => setActiveTab('COMPANY')}
        >
          Company Profile
        </button>
        <button 
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'AUDIT' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          onClick={() => setActiveTab('AUDIT')}
        >
          Audit Log Stream
        </button>
      </div>

      {activeTab === 'USER_MGMT' && (
        <div className="space-y-6">
          {/* Expiration Warning Alert */}
          {expiringUsersCount > 0 && (
            <div className="p-4 rounded-xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center space-x-3 shadow-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                <strong className="text-amber-900 dark:text-amber-100">{expiringUsersCount} user account(s)</strong> have access expiring within the next 7 days. Review roster below to renew or revoke.
              </span>
            </div>
          )}

          {/* KPI Tiles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Registered Users</span>
                <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white mt-1">{kpiData.total}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
                <Settings size={20} />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Accounts</span>
                <div className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">{kpiData.active}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <ShieldCheck size={20} />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">System Administrators</span>
                <div className="text-2xl font-extrabold font-mono text-purple-600 dark:text-purple-400 mt-1">{kpiData.admins}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
                <Lock size={20} />
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search size={15} />
              </div>
              <input 
                type="text" 
                placeholder="Search name, email, username..." 
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter size={15} className="text-slate-400" />
              <select 
                className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="All">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Dispatcher/User">Dispatcher/User</option>
              </select>
              <select 
                className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          {/* User Roster Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                    <th className="p-4">User Details</th>
                    <th className="p-4">Email Address</th>
                    <th className="p-4">Username</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Expiration Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                  {paginatedUsers.length > 0 ? paginatedUsers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="p-4">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{user.name}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">ID: {user.id}</div>
                      </td>
                      <td className="p-4 text-slate-700 dark:text-slate-300 font-mono">{user.email}</td>
                      <td className="p-4 font-mono font-bold text-blue-600 dark:text-blue-400">{user.username}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${
                          user.roleName === 'Admin'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                        }`}>
                          {user.roleName}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${
                          user.isActive
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        }`}>
                          {user.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={getExpirationDaysStyle(user.expirationDate)}>
                          {user.expirationDate ? new Date(user.expirationDate).toISOString().split('T')[0] : 'Permanent (No Expiry)'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition" onClick={() => handleOpenModal(user)} title="Edit">
                            <Edit2 size={15} />
                          </button>
                          {user.expirationDate && (
                            <button className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition" title="Renew (+30 Days)" onClick={() => setRenewItem(user)}>
                              <Calendar size={15} />
                            </button>
                          )}
                          {user.isActive && (
                            <button className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition" title="Revoke Access" onClick={() => setRevokeItem(user)}>
                              <Ban size={15} />
                            </button>
                          )}
                          <button className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition" title="Delete" onClick={() => setDeleteItem(user)}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-500 text-xs italic">
                        No users found matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2">
              <span>Page {currentPage} of {totalPages}</span>
              <div className="flex space-x-2">
                <button className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 text-slate-700 dark:text-slate-300 transition" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}>
                  Previous
                </button>
                <button className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 text-slate-700 dark:text-slate-300 transition" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}>
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'COMPANY' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-6 text-xs text-slate-700 dark:text-slate-300">
          <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Building className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Company Profile & Operations Settings</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Company Legal Name</span>
              <p className="font-extrabold text-slate-900 dark:text-white text-sm mt-0.5">Nune Express LLC</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Tenant Identification ID</span>
              <p className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs mt-0.5">tenant-nune-express</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Primary Admin Email</span>
              <p className="font-mono text-slate-800 dark:text-slate-200 text-xs mt-0.5">admin@nuneexpress.com</p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Factoring Partner Integration</h3>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 space-y-1">
              <p className="text-slate-800 dark:text-slate-200 font-semibold">Partner: <span className="text-emerald-600 dark:text-emerald-400">RTS Financial (Recourse Factoring)</span></p>
              <p className="text-slate-500 dark:text-slate-400">Factoring Rate: 2.0% • Reserve Holdback: 3.0%</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'AUDIT' && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={15} />
            </div>
            <input 
              type="text" 
              placeholder="Search actor name or action..." 
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
            />
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl overflow-hidden max-h-[70vh] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider sticky top-0">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Actor</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Entity Type</th>
                  <th className="p-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                {auditLogs.filter(log => (log.actorName + ' ' + log.action).toLowerCase().includes(auditSearch.toLowerCase())).slice(0, 100).map((log, index) => (
                  <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition font-mono">
                    <td className="p-4 text-slate-500 text-[11px]">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="p-4 font-bold text-blue-600 dark:text-blue-400">{log.actorName}</td>
                    <td className="p-4 text-slate-800 dark:text-slate-200">{log.action}</td>
                    <td className="p-4 text-slate-700 dark:text-slate-300">{log.entityType}</td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 truncate max-w-xs">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl w-full max-w-xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{editItem ? 'Edit User Account' : 'Add New User Account'}</h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Full Name*</label>
                  <input required className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Email Address*</label>
                  <input required type="email" className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Username*</label>
                  <input required className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.username || ''} onChange={e => setFormData({...formData, username: e.target.value})} />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Role*</label>
                  <select required className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.roleName || 'Dispatcher/User'} onChange={e => setFormData({...formData, roleName: e.target.value})}>
                    <option value="Dispatcher/User">Dispatcher/User</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Expiration Date (Optional)</label>
                  <input type="date" className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.expirationDate || ''} onChange={e => setFormData({...formData, expirationDate: e.target.value || undefined})} />
                  <span className="text-[10px] text-slate-500 block mt-1">Leave blank for permanent access</span>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button type="button" className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save User Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Renew Access Modal */}
      {renewItem && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl w-full max-w-sm shadow-2xl space-y-4 text-xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Renew User Access</h2>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">New Expiration Date*</label>
              <input type="date" className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500" value={renewDate} onChange={(e) => setRenewDate(e.target.value)} />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl" onClick={() => setRenewItem(null)}>Cancel</button>
              <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow" onClick={handleRenew} disabled={!renewDate || isLoading}>
                Renew Access
              </button>
            </div>
          </div>
        </div>
      )}

      {revokeItem && (
        <ConfirmModal
          isOpen={!!revokeItem}
          title="Revoke User Access"
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
          title="Delete User Account"
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
