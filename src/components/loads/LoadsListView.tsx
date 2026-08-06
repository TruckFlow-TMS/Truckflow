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
  Button, PageHeader, DataTable, Badge, Avatar, StatCard, EmptyState,
  FilterBar, FilterChips, FilterSearch, DateRangeFilter, statusTone, humanizeStatus,
} from '../ui';
import { ALL_TIME, DateRange, inRange, rangeLabel } from '../../lib/dateRange';
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
  const [dateRange, setDateRange] = useState<DateRange>(ALL_TIME);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDetailLoad, setSelectedDetailLoad] = useState<Load | null>(null);
  const [editingLoad, setEditingLoad] = useState<Load | null>(null);
  const [deletingLoad, setDeletingLoad] = useState<Load | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Two-stage filtering. The date range defines the *book* being looked at, so
  // the KPI strip is computed from it; search and status only narrow which rows
  // of that book are on screen and must not move the totals underneath them.
  const loadsInRange = useMemo(
    () => loads.filter((ld) => inRange(ld.pickupDate, dateRange)),
    [loads, dateRange],
  );

  const filteredLoads = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return loadsInRange.filter((ld) => {
      const matchesSearch =
        ld.loadNumber.toLowerCase().includes(q) ||
        ld.brokerName.toLowerCase().includes(q) ||
        (ld.driverName && ld.driverName.toLowerCase().includes(q)) ||
        (ld.originCity && ld.originCity.toLowerCase().includes(q)) ||
        (ld.destCity && ld.destCity.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'ALL' || ld.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [loadsInRange, searchQuery, statusFilter]);

  // Pagination Slice
  const totalPages = Math.ceil(filteredLoads.length / ITEMS_PER_PAGE) || 1;
  // Clamped, because the result set can shrink underneath a page the user is
  // already on — a narrowed filter, or deleting the last row of the last page.
  // Slicing on a stale page number returns [] and the table renders its empty
  // state over results that do exist, with the pager hidden (totalPages === 1)
  // so there is no control left to get back. Clamping fails safe to the last
  // real page instead.
  const page = Math.min(currentPage, totalPages);
  const paginatedLoads = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredLoads.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLoads, page]);

  const kpis = useMemo(() => {
    const rows = loadsInRange;
    const active = rows.filter((l) =>
      ['DISPATCHED', 'IN_TRANSIT', 'OPEN'].includes(l.status)).length;
    const gross = rows.reduce((sum, l) => sum + l.rateMinor, 0) / 100;
    const unassigned = rows.filter((l) => !l.driverName).length;
    const delivered = rows.filter((l) =>
      ['DELIVERED', 'DELIVERED_POD', 'INVOICED', 'PAID'].includes(l.status)).length;
    const onTime = rows.length ? Math.round((delivered / rows.length) * 1000) / 10 : 0;
    // Rate per load in pickup order — a real trend line for the range rather
    // than the fixed decorative numbers this card used to draw.
    const trend = [...rows]
      .sort((a, b) => (a.pickupDate || '').localeCompare(b.pickupDate || ''))
      .slice(-8)
      .map((l) => l.rateMinor);
    return { count: rows.length, active, gross, unassigned, onTime, trend };
  }, [loadsInRange]);

  const hasActiveFilters =
    searchQuery !== '' || statusFilter !== 'ALL' || dateRange.preset !== 'ALL';

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setDateRange(ALL_TIME);
    setCurrentPage(1);
  };

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
            aria-label={`View details for load ${ld.loadNumber}`}
            className="p-1.5 rounded-ctl text-fg-3 hover:text-accent hover:bg-surface-2 transition-colors"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setEditingLoad(ld); }}
            title="Edit load"
            aria-label={`Edit load ${ld.loadNumber}`}
            className="p-1.5 rounded-ctl text-fg-3 hover:text-accent hover:bg-surface-2 transition-colors"
          >
            <Edit2 size={15} />
          </button>
          {ld.status === 'DELIVERED' && (
            <button
              onClick={(e) => { e.stopPropagation(); handleGenerateInvoice(ld); }}
              title="Generate invoice"
              aria-label={`Generate invoice for load ${ld.loadNumber}`}
              className="p-1.5 rounded-ctl text-pos hover:bg-surface-2 transition-colors"
            >
              <FileText size={15} />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setDeletingLoad(ld); }}
            title="Delete load"
            aria-label={`Delete load ${ld.loadNumber}`}
            className="p-1.5 rounded-ctl text-fg-3 hover:text-danger hover:bg-surface-2 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  // Counts come off the date-scoped set, before search and status are applied,
  // so a chip always shows how much it would return within the current range —
  // not how much survived the filter already on screen.
  const STATUS_OPTIONS = useMemo(() => {
    const count = (status: string) => loadsInRange.filter((l) => l.status === status).length;
    return [
      { value: 'ALL', label: 'All', count: loadsInRange.length },
      { value: 'OPEN', label: 'Unassigned', count: count('OPEN') },
      { value: 'DISPATCHED', label: 'Dispatched', count: count('DISPATCHED') },
      { value: 'IN_TRANSIT', label: 'In transit', count: count('IN_TRANSIT') },
      { value: 'DELIVERED', label: 'Delivered', count: count('DELIVERED') },
      { value: 'INVOICED', label: 'Invoiced', count: count('INVOICED') },
      { value: 'PAID', label: 'Paid', count: count('PAID') },
      { value: 'CANCELLED', label: 'Cancelled', count: count('CANCELLED') },
    ];
  }, [loadsInRange]);

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
        subtitle={
          dateRange.preset === 'ALL'
            ? `${filteredLoads.length} of ${loads.length} loads`
            : `${filteredLoads.length} of ${kpis.count} loads · ${rangeLabel(dateRange).toLowerCase()}`
        }
        actions={
          <>
            <Button variant="secondary">Export</Button>
            <Button icon={<Plus size={13} />} onClick={() => setShowCreateModal(true)}>
              Build a load
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          variant="hero"
          label={`Gross revenue · ${rangeLabel(dateRange)}`}
          value={`$${kpis.gross.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          sub={`Across ${kpis.count} ${kpis.count === 1 ? 'load' : 'loads'} picked up in range`}
          spark={kpis.trend}
          onClick={() => { setStatusFilter('ALL'); setSearchQuery(''); setCurrentPage(1); }}
        />
        <StatCard
          label="Active loads"
          value={String(kpis.active)}
          sub="Unassigned, dispatched or in transit"
          onClick={() => { setStatusFilter('IN_TRANSIT'); setCurrentPage(1); }}
        />
        <StatCard
          variant="ring"
          ringPct={kpis.onTime}
          label="Completed"
          value={`${kpis.onTime}%`}
          sub="Delivered or beyond"
          onClick={() => { setStatusFilter('DELIVERED'); setCurrentPage(1); }}
        />
        <StatCard
          label="Unassigned"
          value={String(kpis.unassigned)}
          sub={kpis.unassigned > 0 ? <span className="text-warn font-semibold">Needs a driver</span> : 'All covered'}
          onClick={() => { setStatusFilter('OPEN'); setCurrentPage(1); }}
        />
      </div>

      <DataTable
        columns={columns}
        rows={paginatedLoads}
        rowKey={(ld) => ld.id}
        onRowClick={(ld) => setSelectedDetailLoad(ld)}
        empty={
          <EmptyState
            icon={<Package size={30} strokeWidth={1.5} />}
            title="No loads match these filters"
            sub={
              hasActiveFilters
                ? `Nothing in ${rangeLabel(dateRange).toLowerCase()} matches the current status or search.`
                : 'Build a load to see it appear here.'
            }
            action={
              hasActiveFilters ? (
                <Button variant="secondary" onClick={clearFilters}>Clear filters</Button>
              ) : (
                <Button icon={<Plus size={13} />} onClick={() => setShowCreateModal(true)}>
                  Build a load
                </Button>
              )
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
              <DateRangeFilter
                label="Filter loads by pickup date"
                value={dateRange}
                onChange={(r) => { setDateRange(r); setCurrentPage(1); }}
              />
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
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary" size="sm"
              icon={<ChevronLeft size={13} />}
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
              Next <ChevronRight size={13} />
            </Button>
          </div>
        </div>
      )}

      {/* Build a load modal */}
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
          title="Delete freight load"
          message={`Deleting load #${deletingLoad.loadNumber} (${deletingLoad.brokerName}) removes it from the book permanently. This action cannot be undone.`}
          confirmPhrase={deletingLoad.loadNumber}
          confirmNoun="load number"
          confirmLabel="Delete load"
          isDanger={true}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingLoad(null)}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};
