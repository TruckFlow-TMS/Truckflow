import React, { useState, useMemo } from 'react';
import { Equipment, Driver } from '../../types/tms';
import { useAuth } from '../../context/AuthContext';
import { mockStore } from '../../services/mockStore';
import { useToast } from '../ui/Toast';
import { ConfirmModal } from '../ui/ConfirmModal';
import { Truck, Search, Plus, Edit2, Trash2, Filter, ShieldCheck, Wrench, Calendar } from 'lucide-react';

interface FleetViewProps {
  equipment: Equipment[];
  drivers: Driver[];
  onReload: () => void;
}

const ITEMS_PER_PAGE = 15;

export const FleetView: React.FC<FleetViewProps> = ({ equipment, drivers, onReload }) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'TRUCK' | 'TRAILER'>('TRUCK');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Equipment | null>(null);
  const [deleteItem, setDeleteItem] = useState<Equipment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Equipment>>({});

  const filteredEquipment = useMemo(() => {
    return equipment.filter(eq => {
      const matchTab = eq.type === activeTab;
      const matchSearch = (eq.unitNumber + ' ' + eq.vin + ' ' + eq.makeModel).toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' || eq.status === statusFilter;
      return matchTab && matchSearch && matchStatus;
    });
  }, [equipment, activeTab, search, statusFilter]);

  const totalPages = Math.ceil(filteredEquipment.length / ITEMS_PER_PAGE);
  const paginatedEquipment = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEquipment.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEquipment, currentPage]);

  const kpiData = useMemo(() => {
    const trucks = equipment.filter(e => e.type === 'TRUCK').length;
    const trailers = equipment.filter(e => e.type === 'TRAILER').length;
    const maintenance = equipment.filter(e => e.status === 'MAINTENANCE').length;
    return { trucks, trailers, maintenance };
  }, [equipment]);

  const handleOpenModal = (eq?: Equipment) => {
    if (eq) {
      setEditItem(eq);
      setFormData(eq);
    } else {
      setEditItem(null);
      setFormData({
        type: activeTab,
        status: 'ACTIVE'
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
        await mockStore.updateEquipment(editItem.id, formData, currentUser);
        showToast('success', 'Equipment updated successfully');
      } else {
        await mockStore.createEquipment(formData as Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>, currentUser);
        showToast('success', 'Equipment created successfully');
      }
      onReload();
      handleCloseModal();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to save equipment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUser || !deleteItem) return;
    
    setIsLoading(true);
    try {
      await mockStore.deleteEquipment(deleteItem.id, currentUser);
      showToast('success', 'Equipment deleted successfully');
      onReload();
      setDeleteItem(null);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to delete equipment');
    } finally {
      setIsLoading(false);
    }
  };

  const isInspectionOverdue = (dateString?: string) => {
    if (!dateString) return false;
    const expDate = new Date(dateString);
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);
    return expDate < in30Days;
  };

  const getDriverName = (id?: string) => {
    if (!id) return 'Unassigned';
    const driver = drivers.find(d => d.id === id);
    return driver ? driver.name : 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Fleet & Asset Roster</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Truck & trailer inventory, VIN numbers, annual inspection dates, & driver assignments.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>+ Add Equipment</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Power Units (Trucks)</span>
            <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white mt-1">{kpiData.trucks}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
            <Truck size={20} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Trailers</span>
            <div className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">{kpiData.trailers}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <ShieldCheck size={20} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">In Maintenance</span>
            <div className="text-2xl font-extrabold font-mono text-rose-600 dark:text-rose-400 mt-1">{kpiData.maintenance}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20">
            <Wrench size={20} />
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl flex flex-wrap gap-4 items-center justify-between">
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 space-x-1">
          <button 
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'TRUCK' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            onClick={() => { setActiveTab('TRUCK'); setCurrentPage(1); }}
          >
            Trucks ({kpiData.trucks})
          </button>
          <button 
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'TRAILER' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            onClick={() => { setActiveTab('TRAILER'); setCurrentPage(1); }}
          >
            Trailers ({kpiData.trailers})
          </button>
        </div>

        <div className="flex items-center space-x-3 flex-1 max-w-md">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={15} />
            </div>
            <input 
              type="text" 
              placeholder="Search Unit #, VIN, Make/Model..." 
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select 
            className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="OUT_OF_SERVICE">Out of Service</option>
          </select>
        </div>
      </div>

      {/* Equipment Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                <th className="p-4">Unit #</th>
                <th className="p-4">Year / Make / Model</th>
                <th className="p-4">VIN Number</th>
                <th className="p-4">License Plate</th>
                <th className="p-4">Annual Inspection</th>
                <th className="p-4">Status</th>
                {activeTab === 'TRUCK' && <th className="p-4">Assigned Driver</th>}
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {paginatedEquipment.length > 0 ? paginatedEquipment.map(eq => (
                <tr key={eq.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="p-4 font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">{eq.unitNumber}</td>
                  <td className="p-4 text-slate-900 dark:text-slate-200">
                    <div className="font-semibold">{eq.makeModel}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">Year: {eq.year}</div>
                  </td>
                  <td className="p-4 font-mono text-slate-500 dark:text-slate-400 text-[11px]">{eq.vin}</td>
                  <td className="p-4 font-mono text-slate-700 dark:text-slate-300">{eq.licensePlate}</td>
                  <td className="p-4 font-mono">
                    <div className="text-slate-700 dark:text-slate-300">{eq.inspectionDueDate}</div>
                    {isInspectionOverdue(eq.inspectionDueDate) && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 inline-block mt-0.5">
                        INSPECTION OVERDUE
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${
                      eq.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : eq.status === 'MAINTENANCE'
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}>
                      {eq.status}
                    </span>
                  </td>
                  {activeTab === 'TRUCK' && (
                    <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">{getDriverName(eq.assignedDriverId)}</td>
                  )}
                  <td className="p-4">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition" onClick={() => handleOpenModal(eq)} title="Edit">
                        <Edit2 size={15} />
                      </button>
                      <button className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition" onClick={() => setDeleteItem(eq)} title="Delete">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={activeTab === 'TRUCK' ? 8 : 7} className="p-12 text-center text-slate-500 text-xs italic">
                    No {activeTab.toLowerCase()}s found.
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl w-full max-w-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{editItem ? 'Edit Equipment Unit' : 'Add New Equipment'}</h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Equipment Type*</label>
                  <select required className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.type || 'TRUCK'} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                    <option value="TRUCK">Truck (Power Unit)</option>
                    <option value="TRAILER">Trailer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Unit Number*</label>
                  <input required className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.unitNumber || ''} onChange={e => setFormData({...formData, unitNumber: e.target.value})} />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">VIN Number*</label>
                  <input required className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.vin || ''} onChange={e => setFormData({...formData, vin: e.target.value})} />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Make & Model*</label>
                  <input required className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.makeModel || ''} onChange={e => setFormData({...formData, makeModel: e.target.value})} />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Model Year*</label>
                  <input required type="number" className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.year || ''} onChange={e => setFormData({...formData, year: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">License Plate</label>
                  <input className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.licensePlate || ''} onChange={e => setFormData({...formData, licensePlate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Inspection Due Date*</label>
                  <input required type="date" className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.inspectionDueDate || ''} onChange={e => setFormData({...formData, inspectionDueDate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Status*</label>
                  <select required className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.status || 'ACTIVE'} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                    <option value="ACTIVE">Active</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="OUT_OF_SERVICE">Out of Service</option>
                  </select>
                </div>
                {formData.type === 'TRUCK' && (
                  <div className="md:col-span-2">
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Assigned Driver</label>
                    <select className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.assignedDriverId || ''} onChange={e => setFormData({...formData, assignedDriverId: e.target.value || undefined})}>
                      <option value="">Unassigned</option>
                      {drivers.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button type="button" className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Equipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteItem && (
        <ConfirmModal
          isOpen={!!deleteItem}
          title="Delete Equipment"
          message={`Are you sure you want to delete ${deleteItem.unitNumber}?`}
          isDanger={true}
          onConfirm={handleDelete}
          onCancel={() => setDeleteItem(null)}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};
