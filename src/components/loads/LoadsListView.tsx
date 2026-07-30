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
  Button, Input, PageHeader, DataTable, Badge, Avatar, StatCard,
  EmptyState, FilterBar, FilterChips, FilterSearch, statusTone, humanizeStatus,
} from '../ui';
import type { Column } from '../ui';
import {
  Package, Plus, FileText, Eye, Edit2, Trash2,
  ChevronLeft, ChevronRight, ArrowRight,
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

  // KPI figures derived from the same filtered set the table shows.
  const kpis = useMemo(() => {
    const active = loads.filter((l) =>
      ['DISPATCHED', 'IN_TRANSIT', 'OPEN'].includes(l.status)).length;
    const gross = loads.reduce((sum, l) => sum + l.rateMinor, 0) / 100;
    const unassigned = loads.filter((l) => !l.driverName).length;
    const delivered = loads.filter((l) =>
      ['DELIVERED', 'DELIVERED_POD', 'INVOICED', 'PAID'].includes(l.status)).length;
    const onTime = loads.length ? Math.round((delivered / loads.length) * 1000) / 10 : 0;
    return { active, gross, unassigned, onTime };
  }, [loads]);

  const money = (minor: number) =>
    `$${(minor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  const columns: Column<Load>[] = [
    {
      key: 'load',
      header: 'Load',
      width: '16%',
      render: (ld) => (
        <>
          <span className="font-semibold text-accent tnum">{ld.loadNumber}</span>
          <span className="block text-[11px] text-fg-3 mt-px tnum">
            {ld.loadedMiles} mi
          </span>
        </>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      width: '20%',
      render: (ld) => (
        <>
          <span className="font-medium">{ld.brokerName}</span>
          <span className="block text-[11px] text-fg-3 mt-px">
            Ref {ld.brokerReference || '—'}
          </span>
        </>
      ),
    },
    {
      key: 'lane',
      header: 'Lane',
      width: '21%',
      render: (ld) => (
        <>
          <span className="font-medium inline-flex items-center gap-1.5">
            {ld.originCity}, {ld.originState}
            <ArrowRight size={12} className="text-fg-3 shrink-0" />
            {ld.destCity}, {ld.destState}
          </span>
          <span className="block text-[11px] text-fg-3 mt-px">
            Pickup {ld.pickupDate || 'TBD'}
          </span>
        </>
      ),
    },
    {
      key: 'driver',
      header: 'Driver',
      width: '16%',
      render: (ld) =>
        ld.driverName ? (
          <span className="inline-flex items-center gap-2">
            <Avatar name={ld.driverName} />
            {ld.driverName}
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 text-fg-3">
            <span className="w-[22px] h-[22px] rounded-full border border-dashed border-bd-strong shrink-0" />
            Unassigned
          </span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '12%',
      render: (ld) => (
        <Badge tone={statusTone(ld.status)}>{humanizeStatus(ld.status)}</Badge>
      ),
    },
    {
      key: 'rate',
      header: 'Rate',
      width: '10%',
      align: 'right',
      render: (ld) => money(ld.rateMinor),
    },
    {
      key: 'actions',
      header: '',
      width: '5%',
      align: 'right',
      render: (ld) => (
        <div className="flex items-center justify-end gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedDetailLoad(ld); }}
            title="View details"
            className="p-1.5 rounded-ctl text-fg-3 hover:text-accent hover:bg-surface-2 transition-colors"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setEditingLoad(ld); }}
            title="Edit load"
            className="p-1.5 rounded-ctl text-fg-3 hover:text-accent hover:bg-surface-2 transition-colors"
          >
            <Edit2 size={15} />
          </button>
          {ld.status === 'DELIVERED' && (
            <button
              onClick={(e) => { e.stopPropagation(); handleGenerateInvoice(ld); }}
              title="Generate invoice"
              className="p-1.5 rounded-ctl text-pos hover:bg-surface-2 transition-colors"
            >
              <FileText size={15} />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setDeletingLoad(ld); }}
            title="Delete load"
            className="p-1.5 rounded-ctl text-fg-3 hover:text-danger hover:bg-surface-2 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  // Counts come off the unfiltered set so a chip always shows how much it
  // would return, not how much survived the filter currently applied.
  const STATUS_OPTIONS = useMemo(() => {
    const count = (status: string) => loads.filter((l) => l.status === status).length;
    return [
      { value: 'ALL', label: 'All', count: loads.length },
      { value: 'OPEN', label: 'Open', count: count('OPEN') },
      { value: 'DISPATCHED', label: 'Dispatched', count: count('DISPATCHED') },
      { value: 'IN_TRANSIT', label: 'In transit', count: count('IN_TRANSIT') },
      { value: 'DELIVERED', label: 'Delivered', count: count('DELIVERED') },
      { value: 'INVOICED', label: 'Invoiced', count: count('INVOICED') },
      { value: 'PAID', label: 'Paid', count: count('PAID') },
      { value: 'CANCELLED', label: 'Cancelled', count: count('CANCELLED') },
    ];
  }, [loads]);

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
    <div className="space-y-3.5">
      <PageHeader
        title="Loads"
        subtitle={`${filteredLoads.length} of ${loads.length} loads`}
        actions={
          <>
            <Button variant="secondary">Export</Button>
            <Button icon={<Plus size={13} />} onClick={() => setShowCreateModal(true)}>
              New load
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          variant="hero"
          label="Gross revenue"
          value={`$${kpis.gross.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          sub={`Across ${loads.length} loads`}
          spark={[4, 6, 5, 9, 7, 12, 10, 15]}
        />
        <StatCard label="Active loads" value={String(kpis.active)} sub="Open, dispatched or in transit" />
        <StatCard variant="ring" ringPct={kpis.onTime} label="Completed" value={`${kpis.onTime}%`} sub="Delivered or beyond" />
        <StatCard
          label="Unassigned"
          value={String(kpis.unassigned)}
          sub={kpis.unassigned > 0 ? <span className="text-warn font-semibold">Needs a driver</span> : 'All covered'}
        />
      </div>

      <DataTable
        columns={columns}
        rows={paginatedLoads}
        rowKey={(ld) => ld.id}
        empty={
          <EmptyState
            icon={<Package size={30} strokeWidth={1.5} />}
            title="No loads match these filters"
            sub="Try a different status, date range or search term."
            action={
              <Button icon={<Plus size={13} />} onClick={() => setShowCreateModal(true)}>
                Book a load
              </Button>
            }
          />
        }
        toolbar={
          <FilterBar
            search={
              <FilterSearch
                value={searchQuery}
                onChange={(v) => { setSearchQuery(v); setCurrentPage(1); }}
                placeholder="Search load, broker, driver…"
              />
            }
            extra={
              <div className="flex items-center gap-1.5">
                <Input
                  type="date"
                  aria-label="Pickup from"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-8 w-auto tnum"
                />
                <span className="text-[11.5px] text-fg-3">to</span>
                <Input
                  type="date"
                  aria-label="Pickup until"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-8 w-auto tnum"
                />
              </div>
            }
            meta={`Showing ${paginatedLoads.length} of ${filteredLoads.length}`}
            chips={
              <FilterChips
                label="Filter loads by status"
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
          <span className="tnum">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary" size="sm"
              icon={<ChevronLeft size={13} />}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="secondary" size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next <ChevronRight size={13} />
            </Button>
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
