import React, { useState, useMemo } from 'react';
import { Invoice, Load, Customer } from '../../types/tms';
import { useAuth } from '../../context/AuthContext';
import { mockStore } from '../../services/mockStore';
import { useToast } from '../ui/Toast';
import { ConfirmModal } from '../ui/ConfirmModal';
import { DollarSign, Search, Plus, Edit2, Trash2, Filter, CheckCircle2, AlertTriangle, FileText, Ban } from 'lucide-react';

interface BillingViewProps {
  invoices: Invoice[];
  loads: Load[];
  customers?: Customer[];
  onReload: () => void;
}

const ITEMS_PER_PAGE = 15;

export const BillingView: React.FC<BillingViewProps> = ({ invoices, loads, customers = [], onReload }) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Invoice | null>(null);
  const [voidItem, setVoidItem] = useState<Invoice | null>(null);
  const [deleteItem, setDeleteItem] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Invoice>>({});

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const customerName = customers.find(c => c.id === inv.customerId)?.name || '';
      const matchSearch = (inv.invoiceNumber + ' ' + customerName).toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' || inv.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [invoices, search, statusFilter, customers]);

  const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInvoices.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredInvoices, currentPage]);

  const kpiData = useMemo(() => {
    const totalAr = invoices.filter(i => i.status === 'ISSUED' || i.status === 'OVERDUE').reduce((acc, curr) => acc + curr.totalMinor, 0);
    const collectedThisMonth = invoices.filter(i => i.status === 'PAID').reduce((acc, curr) => acc + curr.totalMinor, 0);
    const overdueCount = invoices.filter(i => i.status === 'OVERDUE').length;
    return { totalAr, collectedThisMonth, overdueCount };
  }, [invoices]);

  const formatCurrency = (minorUnits?: number) => {
    if (minorUnits === undefined) return '$0.00';
    return '$' + (minorUnits / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleOpenModal = (inv?: Invoice) => {
    if (inv) {
      setEditItem(inv);
      setFormData(inv);
    } else {
      setEditItem(null);
      setFormData({
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        status: 'DRAFT',
        issueDate: new Date().toISOString().split('T')[0]
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditItem(null);
    setFormData({});
  };

  const calculateDriverPay = (subtotalMinor: number) => {
    return Math.round(subtotalMinor * 0.74);
  };

  const handleSubtotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const minor = isNaN(val) ? 0 : Math.round(val * 100);
    setFormData({
      ...formData,
      subtotalMinor: minor,
      totalMinor: minor,
      driverPayMinor: calculateDriverPay(minor)
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      if (editItem) {
        await mockStore.updateInvoice(editItem.id, formData, currentUser);
        showToast('success', 'Invoice updated successfully');
      } else {
        await mockStore.createInvoice(formData as Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>, currentUser);
        showToast('success', 'Invoice created successfully');
      }
      onReload();
      handleCloseModal();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to save invoice');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkPaid = async (inv: Invoice) => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      await mockStore.markInvoicePaid(inv.id, currentUser);
      showToast('success', 'Invoice marked as paid');
      onReload();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to mark paid');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoid = async () => {
    if (!currentUser || !voidItem) return;
    setIsLoading(true);
    try {
      await mockStore.voidInvoice(voidItem.id, currentUser);
      showToast('success', 'Invoice voided');
      onReload();
      setVoidItem(null);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to void invoice');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUser || !deleteItem) return;
    setIsLoading(true);
    try {
      await mockStore.deleteInvoice(deleteItem.id, currentUser);
      showToast('success', 'Invoice deleted');
      onReload();
      setDeleteItem(null);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to delete invoice');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateInvoice = async (loadId: string) => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      await mockStore.generateInvoice(loadId, currentUser);
      showToast('success', 'Invoice generated successfully');
      onReload();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to generate invoice');
    } finally {
      setIsLoading(false);
    }
  };

  const deliveredLoadsReady = loads.filter(l => l.status === 'DELIVERED' && !invoices.some(i => i.loadId === l.id));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Billing, Factoring & Invoices</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            RTS Financial recourse factoring, driver settlements, AR aging, & manual invoices.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>+ Manual Invoice</span>
        </button>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Accounts Receivable</span>
            <div className="text-2xl font-extrabold font-mono text-blue-600 dark:text-blue-400 mt-1">{formatCurrency(kpiData.totalAr)}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
            <DollarSign size={20} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Collected This Month</span>
            <div className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(kpiData.collectedThisMonth)}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Overdue Invoices</span>
            <div className="text-2xl font-extrabold font-mono text-rose-600 dark:text-rose-400 mt-1">{kpiData.overdueCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20">
            <AlertTriangle size={20} />
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
            placeholder="Search Invoice #, customer..." 
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
            <option value="DRAFT">Draft</option>
            <option value="ISSUED">Issued</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="VOID">Void</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                <th className="p-4">Invoice #</th>
                <th className="p-4">Load #</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Dates</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Driver Settlement</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {paginatedInvoices.length > 0 ? paginatedInvoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="p-4 font-mono font-bold text-blue-600 dark:text-blue-400">{inv.invoiceNumber}</td>
                  <td className="p-4 font-mono text-slate-700 dark:text-slate-300">{loads.find(l => l.id === inv.loadId)?.loadNumber || '-'}</td>
                  <td className="p-4 text-slate-900 dark:text-slate-200 font-medium">{customers.find(c => c.id === inv.customerId)?.name || inv.customerId}</td>
                  <td className="p-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                    <div>Issued: {inv.issueDate}</div>
                    <div>Due: {inv.dueDate}</div>
                  </td>
                  <td className="p-4 font-mono font-bold text-slate-900 dark:text-white text-sm">{formatCurrency(inv.totalMinor)}</td>
                  <td className="p-4 font-mono text-slate-700 dark:text-slate-300">{formatCurrency(inv.driverPayMinor)}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${
                      inv.status === 'PAID'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : inv.status === 'ISSUED'
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                        : inv.status === 'OVERDUE'
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition" onClick={() => handleOpenModal(inv)} title="Edit">
                        <Edit2 size={15} />
                      </button>
                      {(inv.status === 'ISSUED' || inv.status === 'OVERDUE') && (
                        <button className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition" title="Mark Paid" onClick={() => handleMarkPaid(inv)}>
                          <CheckCircle2 size={15} />
                        </button>
                      )}
                      {inv.status === 'ISSUED' && (
                        <button className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition" title="Void" onClick={() => setVoidItem(inv)}>
                          <Ban size={15} />
                        </button>
                      )}
                      {(inv.status === 'DRAFT' || inv.status === 'ISSUED') && (
                        <button className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition" title="Delete" onClick={() => setDeleteItem(inv)}>
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500 text-xs italic">
                    No invoices found.
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

      {/* Delivered Loads Ready for Invoicing */}
      {deliveredLoadsReady.length > 0 && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <FileText size={16} className="text-emerald-600 dark:text-emerald-400" />
            <span>Delivered Loads Ready for Invoicing</span>
          </h2>
          <div className="space-y-3">
            {deliveredLoadsReady.map(l => (
              <div key={l.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs mr-3">Load {l.loadNumber}</span>
                  <span className="text-slate-700 dark:text-slate-300 text-xs">Total: {formatCurrency(l.rateMinor)}</span>
                </div>
                <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center space-x-1" onClick={() => handleGenerateInvoice(l.id)}>
                  <FileText size={13} />
                  <span>Generate Invoice</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl w-full max-w-xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{editItem ? 'Edit Invoice' : 'Add Manual Invoice'}</h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Invoice Number*</label>
                <input required className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.invoiceNumber || ''} onChange={e => setFormData({...formData, invoiceNumber: e.target.value})} />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Customer*</label>
                <select required className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.customerId || ''} onChange={e => setFormData({...formData, customerId: e.target.value})}>
                  <option value="">Select Customer</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Issue Date*</label>
                  <input required type="date" className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.issueDate || ''} onChange={e => setFormData({...formData, issueDate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Due Date*</label>
                  <input required type="date" className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.dueDate || ''} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Subtotal ($)*</label>
                <input required type="number" step="0.01" className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.subtotalMinor !== undefined ? formData.subtotalMinor / 100 : ''} onChange={handleSubtotalChange} />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Status</label>
                <select className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.status || 'DRAFT'} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                  <option value="DRAFT">Draft</option>
                  <option value="ISSUED">Issued</option>
                  <option value="PAID">Paid</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="VOID">Void</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button type="button" className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {voidItem && (
        <ConfirmModal
          isOpen={!!voidItem}
          title="Void Invoice"
          message={`Are you sure you want to void invoice ${voidItem.invoiceNumber}? This action cannot be undone.`}
          isDanger={true}
          onConfirm={handleVoid}
          onCancel={() => setVoidItem(null)}
          isLoading={isLoading}
        />
      )}

      {deleteItem && (
        <ConfirmModal
          isOpen={!!deleteItem}
          title="Delete Invoice"
          message={`Are you sure you want to delete invoice ${deleteItem.invoiceNumber}?`}
          isDanger={true}
          onConfirm={handleDelete}
          onCancel={() => setDeleteItem(null)}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};
