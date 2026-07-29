import React, { useState, useMemo } from 'react';
import { Driver } from '../../types/tms';
import { useAuth } from '../../context/AuthContext';
import { mockStore } from '../../services/mockStore';
import { useToast } from '../ui/Toast';
import { ConfirmModal } from '../ui/ConfirmModal';
import { Users, Search, Plus, Edit2, Trash2, Filter, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface DriversViewProps {
  drivers: Driver[];
  onReload: () => void;
}

const ITEMS_PER_PAGE = 15;

export const DriversView: React.FC<DriversViewProps> = ({ drivers, onReload }) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Driver | null>(null);
  const [deleteItem, setDeleteItem] = useState<Driver | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Driver>>({});

  const filteredDrivers = useMemo(() => {
    return drivers.filter(driver => {
      const matchSearch = driver.name.toLowerCase().includes(search.toLowerCase()) ||
                          driver.phone.includes(search) ||
                          driver.cdlNumber.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' || driver.status === statusFilter;
      const matchType = typeFilter === 'All' || driver.employmentType === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [drivers, search, statusFilter, typeFilter]);

  const totalPages = Math.ceil(filteredDrivers.length / ITEMS_PER_PAGE);
  const paginatedDrivers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDrivers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredDrivers, currentPage]);

  const handleOpenModal = (driver?: Driver) => {
    if (driver) {
      setEditItem(driver);
      setFormData(driver);
    } else {
      setEditItem(null);
      setFormData({
        status: 'AVAILABLE',
        employmentType: 'COMPANY_DRIVER',
        payRateType: 'PER_MILE',
        payRateMinor: 65
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
        await mockStore.updateDriver(editItem.id, formData, currentUser);
        showToast('success', 'Driver updated successfully');
      } else {
        await mockStore.createDriver(formData as Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>, currentUser);
        showToast('success', 'Driver created successfully');
      }
      onReload();
      handleCloseModal();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to save driver');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUser || !deleteItem) return;
    
    setIsLoading(true);
    try {
      await mockStore.deleteDriver(deleteItem.id, currentUser);
      showToast('success', 'Driver deleted successfully');
      onReload();
      setDeleteItem(null);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to delete driver');
    } finally {
      setIsLoading(false);
    }
  };

  const isCdlExpired = (dateString?: string) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Driver Roster & Qualifications</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            CDL credentials, medical cards, pay rate profiles, and assignment status.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>+ Add Driver</span>
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
            placeholder="Search name, phone, or CDL number..." 
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
            <option value="AVAILABLE">Available</option>
            <option value="ON_LOAD">On Load</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <select 
            className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="All">All Employment Types</option>
            <option value="COMPANY_DRIVER">Company Driver</option>
            <option value="OWNER_OPERATOR">Owner Operator</option>
          </select>
        </div>
      </div>

      {/* Drivers Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                <th className="p-4">Driver Name</th>
                <th className="p-4">Phone / Email</th>
                <th className="p-4">Type</th>
                <th className="p-4">CDL # & Expiration</th>
                <th className="p-4">Status</th>
                <th className="p-4">Pay Rate</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {paginatedDrivers.length > 0 ? paginatedDrivers.map(driver => (
                <tr key={driver.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="p-4">
                    <div className="font-bold text-slate-900 dark:text-white text-sm">{driver.name}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">{driver.address || 'Address on file'}</div>
                  </td>
                  <td className="p-4 text-slate-700 dark:text-slate-300">
                    <div className="font-mono font-medium">{driver.phone}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">{driver.email}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                      {driver.employmentType === 'COMPANY_DRIVER' ? 'Company Driver' : 'Owner Operator'}
                    </span>
                  </td>
                  <td className="p-4 font-mono">
                    <div className="text-slate-800 dark:text-slate-200 font-semibold">{driver.cdlNumber} ({driver.cdlClass})</div>
                    <div className="flex items-center space-x-1.5 mt-0.5">
                      <span className="text-[10px] text-slate-400">Exp: {driver.cdlExpiration}</span>
                      {isCdlExpired(driver.cdlExpiration) && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                          EXPIRED
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${
                      driver.status === 'AVAILABLE'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : driver.status === 'ON_LOAD'
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}>
                      {driver.status}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-slate-900 dark:text-slate-200 font-semibold">
                    {driver.payRateType === 'FLAT_PERCENT' ? `${driver.payRateMinor}%` : `$${(driver.payRateMinor / 100).toFixed(2)}`}
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-sans">
                      {driver.payRateType === 'PER_MILE' ? '/ mile' : driver.payRateType === 'PER_HOUR' ? '/ hr' : 'gross'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition" onClick={() => handleOpenModal(driver)} title="Edit">
                        <Edit2 size={15} />
                      </button>
                      <button className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition" onClick={() => setDeleteItem(driver)} title="Delete">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500 text-xs italic">
                    No drivers found.
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

      {/* Add / Edit Driver Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl w-full max-w-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{editItem ? 'Edit Driver Profile' : 'Add New Driver'}</h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Full Name*</label>
                  <input required className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Email*</label>
                  <input required type="email" className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Phone*</label>
                  <input required className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Address</label>
                  <input className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Employment Type*</label>
                  <select required className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.employmentType || 'COMPANY_DRIVER'} onChange={e => setFormData({...formData, employmentType: e.target.value as any})}>
                    <option value="COMPANY_DRIVER">Company Driver</option>
                    <option value="OWNER_OPERATOR">Owner Operator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Status*</label>
                  <select required className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.status || 'AVAILABLE'} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                    <option value="AVAILABLE">Available</option>
                    <option value="ON_LOAD">On Load</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">CDL Number*</label>
                  <input required className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.cdlNumber || ''} onChange={e => setFormData({...formData, cdlNumber: e.target.value})} />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">CDL Class</label>
                  <select className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.cdlClass || 'A'} onChange={e => setFormData({...formData, cdlClass: e.target.value})}>
                    <option value="A">Class A</option>
                    <option value="B">Class B</option>
                    <option value="C">Class C</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">CDL Expiration*</label>
                  <input required type="date" className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.cdlExpiration || ''} onChange={e => setFormData({...formData, cdlExpiration: e.target.value})} />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Medical Card Expiration*</label>
                  <input required type="date" className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.medicalCardExpiration || ''} onChange={e => setFormData({...formData, medicalCardExpiration: e.target.value})} />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Pay Rate Type*</label>
                  <select required className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.payRateType || 'PER_MILE'} onChange={e => setFormData({...formData, payRateType: e.target.value as any})}>
                    <option value="PER_MILE">Per Mile (Cents)</option>
                    <option value="FLAT_PERCENT">Flat Gross %</option>
                    <option value="PER_HOUR">Per Hour ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Pay Rate Value (cents / %)*</label>
                  <input required type="number" step="1" className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.payRateMinor || ''} onChange={e => setFormData({...formData, payRateMinor: Number(e.target.value)})} />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button type="button" className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteItem && (
        <ConfirmModal
          isOpen={!!deleteItem}
          title="Delete Driver"
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
