import React, { useState, useMemo } from 'react';
import { Customer } from '../../types/tms';
import { useAuth } from '../../context/AuthContext';
import { mockStore } from '../../services/mockStore';
import { useToast } from '../ui/Toast';
import { ConfirmModal } from '../ui/ConfirmModal';
import { Building2, Search, Plus, Edit2, Trash2, Filter } from 'lucide-react';

interface CustomersViewProps {
  customers: Customer[];
  onReload: () => void;
}

const ITEMS_PER_PAGE = 15;

export const CustomersView: React.FC<CustomersViewProps> = ({ customers, onReload }) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Customer | null>(null);
  const [deleteItem, setDeleteItem] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Customer>>({});

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const matchSearch = (customer.name + ' ' + customer.contactPerson + ' ' + customer.contactEmail + ' ' + (customer.mcNumber||'')).toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' ? true : statusFilter === 'Active' ? customer.isActive : !customer.isActive;
      return matchSearch && matchStatus;
    });
  }, [customers, search, statusFilter]);

  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCustomers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCustomers, currentPage]);

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditItem(customer);
      setFormData(customer);
    } else {
      setEditItem(null);
      setFormData({
        isActive: true,
        paymentTermsDays: 30
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
        await mockStore.updateCustomer(editItem.id, formData, currentUser);
        showToast('success', 'Customer updated successfully');
      } else {
        await mockStore.createCustomer(formData as Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>, currentUser);
        showToast('success', 'Customer created successfully');
      }
      onReload();
      handleCloseModal();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to save customer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUser || !deleteItem) return;
    
    setIsLoading(true);
    try {
      await mockStore.deleteCustomer(deleteItem.id, currentUser);
      showToast('success', 'Customer deleted successfully');
      onReload();
      setDeleteItem(null);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to delete customer');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (minorUnits?: number) => {
    if (minorUnits === undefined) return '$0.00';
    return '$' + (minorUnits / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleCreditLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setFormData({ ...formData, creditLimitMinor: isNaN(value) ? 0 : Math.round(value * 100) });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Broker Partners & Customer Accounts</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Credit limits, payment terms, historical average days-to-pay, & broker ratings.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>+ Add Customer / Broker</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={15} />
          </div>
          <input 
            type="text" 
            placeholder="Search company name, contact, MC#..." 
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter size={15} className="text-slate-400" />
          <select 
            className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Customer Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                <th className="p-4">Company Name</th>
                <th className="p-4">Contact Person</th>
                <th className="p-4">Phone / Email</th>
                <th className="p-4">MC / DOT #</th>
                <th className="p-4">Credit Limit</th>
                <th className="p-4">Terms</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {paginatedCustomers.length > 0 ? paginatedCustomers.map(customer => (
                <tr key={customer.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="p-4">
                    <div className="font-bold text-slate-900 dark:text-white text-sm">{customer.name}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">{customer.city}, {customer.state}</div>
                  </td>
                  <td className="p-4 text-slate-700 dark:text-slate-200 font-medium">{customer.contactPerson}</td>
                  <td className="p-4 text-slate-700 dark:text-slate-300">
                    <div className="font-mono font-medium">{customer.contactPhone}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">{customer.contactEmail}</div>
                  </td>
                  <td className="p-4 font-mono text-slate-500 dark:text-slate-400 text-[11px]">{customer.mcNumber || '-'}</td>
                  <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(customer.creditLimitMinor)}</td>
                  <td className="p-4 font-mono text-slate-700 dark:text-slate-300">{customer.paymentTermsDays} Days</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${
                      customer.isActive
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}>
                      {customer.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition" onClick={() => handleOpenModal(customer)} title="Edit">
                        <Edit2 size={15} />
                      </button>
                      <button className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition" onClick={() => setDeleteItem(customer)} title="Delete">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500 text-xs italic">
                    No customer accounts found.
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

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl w-full max-w-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{editItem ? 'Edit Customer Account' : 'Add New Customer / Broker'}</h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Company Name*</label>
                  <input required className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Contact Person*</label>
                  <input required className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.contactPerson || ''} onChange={e => setFormData({...formData, contactPerson: e.target.value})} />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Contact Email*</label>
                  <input required type="email" className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.contactEmail || ''} onChange={e => setFormData({...formData, contactEmail: e.target.value})} />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Contact Phone*</label>
                  <input required className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.contactPhone || ''} onChange={e => setFormData({...formData, contactPhone: e.target.value})} />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">MC Number</label>
                  <input className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.mcNumber || ''} onChange={e => setFormData({...formData, mcNumber: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Billing Address</label>
                  <input className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.billingAddress || ''} onChange={e => setFormData({...formData, billingAddress: e.target.value})} />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Payment Terms (Days)*</label>
                  <input required type="number" className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.paymentTermsDays || ''} onChange={e => setFormData({...formData, paymentTermsDays: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Credit Limit ($)*</label>
                  <input required type="number" step="0.01" className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.creditLimitMinor !== undefined ? formData.creditLimitMinor / 100 : ''} onChange={handleCreditLimitChange} />
                </div>
                <div className="md:col-span-2 flex items-center pt-2">
                  <input type="checkbox" id="isActive" className="mr-2 rounded border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-blue-600 focus:ring-blue-500" checked={formData.isActive || false} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
                  <label htmlFor="isActive" className="text-slate-700 dark:text-slate-300 font-semibold">Active Customer Account</label>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button type="button" className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteItem && (
        <ConfirmModal
          isOpen={!!deleteItem}
          title="Delete Customer Account"
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
