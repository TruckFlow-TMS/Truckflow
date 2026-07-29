import React, { useState, useMemo } from 'react';
import { Load, Driver, Equipment, Customer } from '../../types/tms';
import { mockStore } from '../../services/mockStore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/Toast';
import { ConfirmModal } from '../ui/ConfirmModal';
import { EditLoadModal } from './EditLoadModal';
import { LoadDetailModal } from './LoadDetailModal';
import { CreateLoadModal } from './CreateLoadModal';

import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  FileText, 
  Eye, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  ArrowRight
} from 'lucide-react';

interface LoadsListViewProps {
  loads: Load[];
  drivers: Driver[];
  equipment: Equipment[];
  customers: Customer[];
  onReload: () => void;
}

const ITEMS_PER_PAGE = 15;

export const LoadsListView: React.FC<LoadsListViewProps> = ({
  loads,
  drivers,
  equipment,
  customers,
  onReload,
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  // Filters & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDetailLoad, setSelectedDetailLoad] = useState<Load | null>(null);
  const [editingLoad, setEditingLoad] = useState<Load | null>(null);
  const [deletingLoad, setDeletingLoad] = useState<Load | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtered Loads Calculation
  const filteredLoads = useMemo(() => {
    return loads.filter((ld) => {
      const matchesSearch =
        ld.loadNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ld.brokerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ld.driverName && ld.driverName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (ld.originCity && ld.originCity.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (ld.destCity && ld.destCity.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || ld.status === statusFilter;

      let matchesDate = true;
      if (startDate && ld.pickupDate) {
        matchesDate = matchesDate && ld.pickupDate >= startDate;
      }
      if (endDate && ld.pickupDate) {
        matchesDate = matchesDate && ld.pickupDate <= endDate;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [loads, searchQuery, statusFilter, startDate, endDate]);

  // Pagination Slice
  const totalPages = Math.ceil(filteredLoads.length / ITEMS_PER_PAGE) || 1;
  const paginatedLoads = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLoads.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLoads, currentPage]);

  // Action Handlers
  const handleConfirmDelete = async () => {
    if (!deletingLoad || !currentUser) return;
    setIsDeleting(true);
    try {
      await mockStore.deleteLoad(deletingLoad.id, currentUser);
      showToast('success', `Load #${deletingLoad.loadNumber} deleted successfully.`);
      onReload();
      setDeletingLoad(null);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete load.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleGenerateInvoice = async (ld: Load) => {
    if (!currentUser) return;
    try {
      await mockStore.generateInvoice(ld.id, currentUser);
      showToast('success', `Invoice generated for Load #${ld.loadNumber}`);
      onReload();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to generate invoice.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Dispatches & Loads Roster</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage all freight shipments, rate confirmations, driver assignments, and delivery statuses.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>+ Book New Load</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={15} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Load #, Customer, Driver..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Filter size={14} />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
            >
              <option value="ALL">All Load Statuses</option>
              <option value="OPEN">OPEN (Unassigned)</option>
              <option value="DISPATCHED">DISPATCHED</option>
              <option value="IN_TRANSIT">IN TRANSIT</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="INVOICED">INVOICED</option>
              <option value="PAID">PAID</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono transition"
            />
          </div>

          {/* End Date */}
          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono transition"
            />
          </div>
        </div>
      </div>

      {/* Main Loads Data Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                <th className="p-4">Load #</th>
                <th className="p-4">Route (Origin → Dest)</th>
                <th className="p-4">Broker / Customer</th>
                <th className="p-4">Driver & Truck</th>
                <th className="p-4">Status</th>
                <th className="p-4">Rate ($)</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {paginatedLoads.length > 0 ? (
                paginatedLoads.map((ld) => (
                  <tr key={ld.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="p-4">
                      <button
                        onClick={() => setSelectedDetailLoad(ld)}
                        className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline text-sm"
                      >
                        {ld.loadNumber}
                      </button>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">Ref: {ld.brokerReference || '-'}</div>
                    </td>

                    <td className="p-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-200 flex items-center space-x-1.5">
                        <span>{ld.originCity}, {ld.originState}</span>
                        <ArrowRight size={12} className="text-slate-400 dark:text-slate-500" />
                        <span>{ld.destCity}, {ld.destState}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                        Pickup: {ld.pickupDate || 'TBD'} • {ld.loadedMiles} miles
                      </div>
                    </td>

                    <td className="p-4 text-slate-800 dark:text-slate-200 font-medium">
                      {ld.brokerName}
                    </td>

                    <td className="p-4">
                      <div className="text-slate-900 dark:text-slate-200 font-bold">
                        {ld.driverName || <span className="text-amber-600 dark:text-amber-400 font-normal italic">Unassigned</span>}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                        Truck: {ld.truckNumber || '-'} • Trailer: {ld.trailerNumber || '-'}
                      </div>
                    </td>

                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${
                        ld.status === 'DELIVERED' || ld.status === 'PAID'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : ld.status === 'IN_TRANSIT'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : ld.status === 'DISPATCHED'
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}>
                        {ld.status}
                      </span>
                    </td>

                    <td className="p-4 font-mono font-extrabold text-slate-900 dark:text-white text-sm">
                      ${(ld.rateMinor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="p-4">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setSelectedDetailLoad(ld)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          onClick={() => setEditingLoad(ld)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          title="Edit Load"
                        >
                          <Edit2 size={15} />
                        </button>

                        {ld.status === 'DELIVERED' && (
                          <button
                            onClick={() => handleGenerateInvoice(ld)}
                            className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                            title="Generate Invoice"
                          >
                            <FileText size={15} />
                          </button>
                        )}

                        <button
                          onClick={() => setDeletingLoad(ld)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          title="Delete Load"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500 italic text-xs">
                    No dispatches or loads found matching your filter criteria.
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
          <span>
            Showing Page <strong className="text-slate-900 dark:text-white">{currentPage}</strong> of <strong className="text-slate-900 dark:text-white">{totalPages}</strong> ({filteredLoads.length} Total Loads)
          </span>

          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 text-slate-700 dark:text-slate-300 transition flex items-center space-x-1"
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 text-slate-700 dark:text-slate-300 transition flex items-center space-x-1"
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Create / Book Load Modal */}
      {showCreateModal && (
        <CreateLoadModal
          isOpen={showCreateModal}
          customers={customers}
          drivers={drivers}
          equipment={equipment}
          onClose={() => setShowCreateModal(false)}
          onReload={onReload}
        />
      )}

      {/* Edit Load Modal */}
      {editingLoad && (
        <EditLoadModal
          isOpen={!!editingLoad}
          load={editingLoad}
          customers={customers}
          drivers={drivers}
          equipment={equipment}
          onClose={() => setEditingLoad(null)}
          onReload={onReload}
        />
      )}

      {/* Detail Load Modal */}
      {selectedDetailLoad && (
        <LoadDetailModal
          load={selectedDetailLoad}
          onClose={() => setSelectedDetailLoad(null)}
          onReload={onReload}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingLoad && (
        <ConfirmModal
          isOpen={!!deletingLoad}
          title="Delete Freight Load"
          message={`Are you sure you want to delete Load #${deletingLoad.loadNumber}? This action cannot be undone.`}
          isDanger={true}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingLoad(null)}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};
