import React, { useState, useMemo } from 'react';
import { Equipment, EquipmentStatus, Driver } from '../../types/tms';
import { useAuth } from '../../context/AuthContext';
import { mockStore } from '../../services/mockStore';
import { useToast } from '../ui/Toast';
import { ConfirmModal } from '../ui/ConfirmModal';
import {
  Button, Input, Select, Modal, PageHeader, DataTable, Badge, StatCard, StatusPill,
  EmptyState, FilterBar, FilterChips, FilterSearch, humanizeStatus,
} from '../ui';
import type { Column } from '../ui';
import { cn } from '../../lib/cn';
import { Truck, Plus, Edit2, Trash2, ShieldCheck, Wrench, ChevronLeft, ChevronRight, Link2, Unlink } from 'lucide-react';

interface FleetViewProps {
  equipment: Equipment[];
  drivers: Driver[];
  onReload: () => void;
}

const ITEMS_PER_PAGE = 15;

const STATUS_OPTIONS = [
  { value: 'All', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'OUT_OF_SERVICE', label: 'Out of service' },
];

/** The filter chips carry an extra "All"; the pill menu must not offer it. */
const SETTABLE_STATUSES = STATUS_OPTIONS.filter(o => o.value !== 'All');

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

  const totalPages = Math.ceil(filteredEquipment.length / ITEMS_PER_PAGE) || 1;
  // Clamped so a result set that shrinks under the current page (narrowed
  // filter, deleted row) falls back to the last real page instead of slicing
  // past the end and showing the empty state over rows that do exist.
  const page = Math.min(currentPage, totalPages);
  const paginatedEquipment = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredEquipment.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEquipment, page]);

  const kpiData = useMemo(() => {
    const trucks = equipment.filter(e => e.type === 'TRUCK').length;
    const trailers = equipment.filter(e => e.type === 'TRAILER').length;
    const maintenance = equipment.filter(e => e.status === 'MAINTENANCE').length;
    const total = equipment.length;
    const inServicePct = total ? Math.round(((total - maintenance) / total) * 1000) / 10 : 0;
    return { trucks, trailers, maintenance, total, inServicePct };
  }, [equipment]);

  const handleOpenModal = (eq?: Equipment) => {
    if (eq) {
      setEditItem(eq);
      setFormData(eq);
    } else {
      setEditItem(null);
      setFormData({
        type: activeTab,
        status: 'ACTIVE',
        linkedEquipmentId: undefined,
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

  // Optimistic-free: the pill shows its own spinner and the reload repaints the
  // row, so a rejected write never leaves a lie on screen.
  const handleStatusChange = async (eq: Equipment, status: EquipmentStatus) => {
    if (!currentUser) return;
    try {
      await mockStore.updateEquipmentStatus(eq.id, status, currentUser);
      showToast('success', `${eq.unitNumber} set to ${humanizeStatus(status)}`);
      onReload();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to update status');
    }
  };

  const unitById = (id?: string) => (id ? equipment.find(e => e.id === id) : undefined);

  // ─── Truck ↔ trailer pairing (form) ───────────────────────────────────────
  const formType = formData.type || 'TRUCK';
  const partnerType = formType === 'TRUCK' ? 'TRAILER' : 'TRUCK';

  /** Every unit of the opposite type, unpaired ones first — those are the
   *  no-consequence picks, and burying them under taken units is what makes a
   *  dispatcher unhook the wrong trailer. */
  const linkCandidates = useMemo(() => {
    const partnerOf = (eq: Equipment) => equipment.find(e => e.id === eq.linkedEquipmentId);
    return equipment
      .filter(e => e.type === partnerType)
      .map(e => {
        const holder = partnerOf(e);
        // A unit already paired to the record being edited is not "taken".
        const taken = holder && holder.id !== editItem?.id ? holder : undefined;
        return {
          value: e.id,
          label: taken
            ? `${e.unitNumber} · ${e.makeModel} — linked to ${taken.unitNumber}`
            : `${e.unitNumber} · ${e.makeModel} — available`,
          taken: !!taken,
        };
      })
      .sort((a, b) => Number(a.taken) - Number(b.taken) || a.label.localeCompare(b.label));
  }, [equipment, partnerType, editItem]);

  const linkTarget = unitById(formData.linkedEquipmentId);
  const stolenFrom = linkTarget && linkTarget.linkedEquipmentId && linkTarget.linkedEquipmentId !== editItem?.id
    ? unitById(linkTarget.linkedEquipmentId)
    : undefined;
  const availableCount = linkCandidates.filter(c => !c.taken).length;

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

  const columns: Column<Equipment>[] = useMemo(() => {
    const base: Column<Equipment>[] = [
      {
        key: 'unit',
        header: 'Unit #',
        width: '10%',
        render: (eq) => <span className="font-semibold text-accent tnum">{eq.unitNumber}</span>,
      },
      {
        key: 'makeModel',
        header: 'Year / make / model',
        width: '18%',
        render: (eq) => (
          <>
            <span className="font-medium">{eq.makeModel}</span>
            <span className="block text-[11px] text-fg-3 mt-px tnum">Year: {eq.year}</span>
          </>
        ),
      },
      {
        key: 'vin',
        header: 'VIN number',
        width: '14%',
        render: (eq) => <span className="text-fg-2 text-[12px] tnum">{eq.vin}</span>,
      },
      {
        key: 'plate',
        header: 'License plate',
        width: '9%',
        render: (eq) => <span className="tnum">{eq.licensePlate || '—'}</span>,
      },
      {
        key: 'linked',
        header: activeTab === 'TRUCK' ? 'Linked trailer' : 'Linked truck',
        width: '12%',
        render: (eq) => {
          const partner = unitById(eq.linkedEquipmentId);
          if (!partner) {
            return (
              <span className="inline-flex items-center gap-1 text-[11.5px] text-fg-3">
                <Unlink size={12} className="shrink-0" />
                Not linked
              </span>
            );
          }
          return (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-accent-weak text-accent"
              title={`${partner.unitNumber} · ${partner.makeModel}`}
            >
              <Link2 size={11} className="shrink-0" />
              <span className="tnum">{partner.unitNumber}</span>
            </span>
          );
        },
      },
      {
        key: 'inspection',
        header: 'Annual inspection',
        width: '14%',
        render: (eq) => (
          <>
            <span className="tnum">{eq.inspectionDueDate}</span>
            {isInspectionOverdue(eq.inspectionDueDate) && (
              <span className="block mt-0.5">
                <Badge tone="danger" dot={false}>Overdue</Badge>
              </span>
            )}
          </>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        width: '13%',
        render: (eq) => (
          <StatusPill
            value={eq.status}
            options={SETTABLE_STATUSES}
            subject={eq.unitNumber}
            onChange={(next) => handleStatusChange(eq, next as EquipmentStatus)}
          />
        ),
      },
    ];

    if (activeTab === 'TRUCK') {
      base.push({
        key: 'driver',
        header: 'Assigned driver',
        width: '12%',
        render: (eq) => <span className="font-medium">{getDriverName(eq.assignedDriverId)}</span>,
      });
    }

    base.push({
      key: 'actions',
      header: '',
      width: '7%',
      align: 'right',
      render: (eq) => (
        <div className="flex items-center justify-end gap-0.5">
          <button
            onClick={() => handleOpenModal(eq)}
            title="Edit"
            aria-label={`Edit unit ${eq.unitNumber}`}
            className="p-1.5 rounded-ctl text-fg-3 hover:text-accent hover:bg-surface-2 transition-colors"
          >
            <Edit2 size={15} />
          </button>
          <button
            onClick={() => setDeleteItem(eq)}
            title="Delete"
            aria-label={`Delete unit ${eq.unitNumber}`}
            className="p-1.5 rounded-ctl text-fg-3 hover:text-danger hover:bg-surface-2 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    });

    return base;
    // `equipment` matters here too: the linked column resolves partner units out
    // of it, so a memo keyed only on the tab would keep painting stale pairings.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, drivers, equipment]);

  return (
    <div className="space-y-3.5">
      <PageHeader
        title="Fleet & asset roster"
        subtitle="Truck & trailer inventory, VIN numbers, annual inspection dates, driver assignments, & truck–trailer pairings."
        actions={
          <Button icon={<Plus size={13} />} onClick={() => handleOpenModal()}>
            Add equipment
          </Button>
        }
      />

      {/* Three across, not four: the power-unit count is already the first half
          of the hero card's subline, so a card of its own only repeated it. */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          variant="hero"
          label="Total fleet assets"
          value={String(kpiData.total)}
          sub={`${kpiData.trucks} power units · ${kpiData.trailers} trailers`}
        />
        <StatCard
          variant="ring"
          ringPct={kpiData.inServicePct}
          label="In service"
          value={`${kpiData.inServicePct}%`}
          sub="Not held in maintenance"
        />
        <StatCard
          label="In maintenance"
          value={String(kpiData.maintenance)}
          sub={kpiData.maintenance > 0 ? <span className="text-warn font-semibold">Needs attention</span> : 'All clear'}
        />
      </div>

      <DataTable
        columns={columns}
        rows={paginatedEquipment}
        rowKey={(eq) => eq.id}
        empty={
          <EmptyState
            icon={<Truck size={30} strokeWidth={1.5} />}
            title={`No ${activeTab.toLowerCase()}s found`}
            sub="Try a different status or search term."
            action={
              <Button icon={<Plus size={13} />} onClick={() => handleOpenModal()}>
                Add equipment
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
                placeholder="Search unit #, VIN, make/model…"
                className="sm:w-[220px]"
              />
            }
            extra={
              // A segmented control, not a filter: it swaps which table you are
              // looking at (and its columns), so it stays visually distinct
              // from the status chips below.
              <div className="flex bg-surface-2 p-1 rounded-ctl border border-bd gap-1 shrink-0">
                <button
                  className={cn(
                    'px-3 py-1 rounded-ctl text-[12px] font-semibold transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                    activeTab === 'TRUCK' ? 'bg-accent-grad text-on-hero shadow-btn' : 'text-fg-2 hover:text-fg',
                  )}
                  onClick={() => { setActiveTab('TRUCK'); setCurrentPage(1); }}
                >
                  <ShieldCheck size={13} className="inline -mt-0.5 mr-1" />
                  Trucks ({kpiData.trucks})
                </button>
                <button
                  className={cn(
                    'px-3 py-1 rounded-ctl text-[12px] font-semibold transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                    activeTab === 'TRAILER' ? 'bg-accent-grad text-on-hero shadow-btn' : 'text-fg-2 hover:text-fg',
                  )}
                  onClick={() => { setActiveTab('TRAILER'); setCurrentPage(1); }}
                >
                  <Wrench size={13} className="inline -mt-0.5 mr-1" />
                  Trailers ({kpiData.trailers})
                </button>
              </div>
            }
            meta={`Showing ${paginatedEquipment.length} of ${filteredEquipment.length}`}
            chips={
              <FilterChips
                label="Filter equipment by status"
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

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editItem ? 'Edit equipment unit' : 'Add new equipment'}
        busy={isLoading}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit" form="equipment-form" loading={isLoading}>
              {isLoading ? 'Saving…' : 'Save equipment'}
            </Button>
          </>
        }
      >
        <form id="equipment-form" onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Equipment type*"
            required
            value={formType}
            // Flipping the type invalidates any pairing already picked — a
            // trailer cannot stay hooked to what just became another trailer.
            onChange={e => setFormData({ ...formData, type: e.target.value as any, linkedEquipmentId: undefined })}
            options={[
              { value: 'TRUCK', label: 'Truck (power unit)' },
              { value: 'TRAILER', label: 'Trailer' },
            ]}
          />
          <Input
            label="Unit number*"
            required
            value={formData.unitNumber || ''}
            onChange={e => setFormData({ ...formData, unitNumber: e.target.value })}
          />
          <Input
            label="VIN number*"
            required
            value={formData.vin || ''}
            onChange={e => setFormData({ ...formData, vin: e.target.value })}
          />
          <Input
            label="Make & model*"
            required
            value={formData.makeModel || ''}
            onChange={e => setFormData({ ...formData, makeModel: e.target.value })}
          />
          <Input
            label="Model year*"
            required
            type="number"
            value={formData.year ?? ''}
            onChange={e => setFormData({ ...formData, year: Number(e.target.value) })}
          />
          <Input
            label="License plate"
            value={formData.licensePlate || ''}
            onChange={e => setFormData({ ...formData, licensePlate: e.target.value })}
          />
          <Input
            label="Inspection due date*"
            required
            type="date"
            value={formData.inspectionDueDate || ''}
            onChange={e => setFormData({ ...formData, inspectionDueDate: e.target.value })}
          />
          <Select
            label="Status*"
            required
            value={formData.status || 'ACTIVE'}
            onChange={e => setFormData({ ...formData, status: e.target.value as any })}
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'MAINTENANCE', label: 'Maintenance' },
              { value: 'OUT_OF_SERVICE', label: 'Out of service' },
            ]}
          />
          {formType === 'TRUCK' && (
            <Select
              label="Assigned driver"
              value={formData.assignedDriverId || ''}
              onChange={e => setFormData({ ...formData, assignedDriverId: e.target.value || undefined })}
              options={[
                { value: '', label: 'Unassigned' },
                ...drivers.map(d => ({ value: d.id, label: d.name })),
              ]}
            />
          )}

          <div className={cn(formType === 'TRUCK' ? '' : 'md:col-span-2')}>
            <Select
              label={formType === 'TRUCK' ? 'Linked trailer' : 'Linked truck'}
              value={formData.linkedEquipmentId || ''}
              onChange={e => setFormData({ ...formData, linkedEquipmentId: e.target.value || undefined })}
              hint={
                stolenFrom
                  ? undefined
                  : linkCandidates.length === 0
                    ? `No ${partnerType.toLowerCase()}s on the roster yet`
                    : `${availableCount} of ${linkCandidates.length} available`
              }
              options={[
                { value: '', label: 'Not linked' },
                ...linkCandidates.map(({ value, label }) => ({ value, label })),
              ]}
            />
            {stolenFrom && (
              <div className="mt-1.5 flex items-start gap-1.5 text-[11px] text-warn">
                <Link2 size={12} className="shrink-0 mt-px" />
                <span>
                  {linkTarget?.unitNumber} is linked to {stolenFrom.unitNumber} right now.
                  Saving moves it here and leaves {stolenFrom.unitNumber} unlinked.
                </span>
              </div>
            )}
          </div>
        </form>
      </Modal>

      {deleteItem && (
        <ConfirmModal
          isOpen={!!deleteItem}
          title="Delete equipment"
          message={
            `Deleting unit ${deleteItem.unitNumber} (${deleteItem.makeModel}) removes it from the fleet permanently`
            + (unitById(deleteItem.linkedEquipmentId)
              ? ` and unlinks ${unitById(deleteItem.linkedEquipmentId)!.unitNumber}`
              : '')
            + '. This action cannot be undone.'
          }
          confirmPhrase={deleteItem.unitNumber}
          confirmNoun="unit number"
          confirmLabel="Delete unit"
          isDanger={true}
          onConfirm={handleDelete}
          onCancel={() => setDeleteItem(null)}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};
