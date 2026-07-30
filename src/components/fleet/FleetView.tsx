import React, { useState, useMemo } from 'react';
import { Equipment, Driver } from '../../types/tms';
import { useAuth } from '../../context/AuthContext';
import { mockStore } from '../../services/mockStore';
import { useToast } from '../ui/Toast';
import { ConfirmModal } from '../ui/ConfirmModal';
import {
  Button, Input, Select, Modal, PageHeader, DataTable, Badge, StatCard,
  EmptyState, statusTone, humanizeStatus,
} from '../ui';
import type { Column } from '../ui';
import { cn } from '../../lib/cn';
import { Truck, Search, Plus, Edit2, Trash2, ShieldCheck, Wrench, ChevronLeft, ChevronRight } from 'lucide-react';

interface FleetViewProps {
  equipment: Equipment[];
  drivers: Driver[];
  onReload: () => void;
}

const ITEMS_PER_PAGE = 15;

const STATUS_OPTIONS = [
  { value: 'All', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'OUT_OF_SERVICE', label: 'Out of service' },
];

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
  const paginatedEquipment = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEquipment.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEquipment, currentPage]);

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
        width: '16%',
        render: (eq) => <span className="text-fg-2 text-[12px] tnum">{eq.vin}</span>,
      },
      {
        key: 'plate',
        header: 'License plate',
        width: '10%',
        render: (eq) => <span className="tnum">{eq.licensePlate || '—'}</span>,
      },
      {
        key: 'inspection',
        header: 'Annual inspection',
        width: '16%',
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
        width: '12%',
        render: (eq) => <Badge tone={statusTone(eq.status)}>{humanizeStatus(eq.status)}</Badge>,
      },
    ];

    if (activeTab === 'TRUCK') {
      base.push({
        key: 'driver',
        header: 'Assigned driver',
        width: '13%',
        render: (eq) => <span className="font-medium">{getDriverName(eq.assignedDriverId)}</span>,
      });
    }

    base.push({
      key: 'actions',
      header: '',
      width: '8%',
      align: 'right',
      render: (eq) => (
        <div className="flex items-center justify-end gap-0.5">
          <button
            onClick={() => handleOpenModal(eq)}
            title="Edit"
            className="p-1.5 rounded-ctl text-fg-3 hover:text-accent hover:bg-surface-2 transition-colors"
          >
            <Edit2 size={15} />
          </button>
          <button
            onClick={() => setDeleteItem(eq)}
            title="Delete"
            className="p-1.5 rounded-ctl text-fg-3 hover:text-danger hover:bg-surface-2 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    });

    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, drivers]);

  return (
    <div className="space-y-3.5">
      <PageHeader
        title="Fleet & asset roster"
        subtitle="Truck & trailer inventory, VIN numbers, annual inspection dates, & driver assignments."
        actions={
          <Button icon={<Plus size={13} />} onClick={() => handleOpenModal()}>
            Add equipment
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          variant="hero"
          label="Total fleet assets"
          value={String(kpiData.total)}
          sub={`${kpiData.trucks} power units · ${kpiData.trailers} trailers`}
        />
        <StatCard
          label="Power units (trucks)"
          value={String(kpiData.trucks)}
          sub="Tractors on the roster"
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
          <>
            <div className="flex bg-surface-2 p-1 rounded-ctl border border-bd gap-1">
              <button
                className={cn(
                  'px-3 py-1.5 rounded-ctl text-[12px] font-semibold transition-colors',
                  activeTab === 'TRUCK' ? 'bg-accent-grad text-on-hero shadow-btn' : 'text-fg-2 hover:text-fg',
                )}
                onClick={() => { setActiveTab('TRUCK'); setCurrentPage(1); }}
              >
                <ShieldCheck size={13} className="inline -mt-0.5 mr-1" />
                Trucks ({kpiData.trucks})
              </button>
              <button
                className={cn(
                  'px-3 py-1.5 rounded-ctl text-[12px] font-semibold transition-colors',
                  activeTab === 'TRAILER' ? 'bg-accent-grad text-on-hero shadow-btn' : 'text-fg-2 hover:text-fg',
                )}
                onClick={() => { setActiveTab('TRAILER'); setCurrentPage(1); }}
              >
                <Wrench size={13} className="inline -mt-0.5 mr-1" />
                Trailers ({kpiData.trailers})
              </button>
            </div>

            <div className="relative w-full sm:w-[220px]">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-3 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Search unit #, VIN, make/model…"
                className="w-full h-8 pl-8 pr-3 bg-surface-2 border border-bd rounded-ctl text-[12.5px] text-fg placeholder:text-fg-3 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
              />
            </div>

            <Select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              options={STATUS_OPTIONS}
              className="h-8 w-auto"
            />

            <span className="ml-auto text-[11.5px] text-fg-3 tnum shrink-0">
              Showing {paginatedEquipment.length} of {filteredEquipment.length}
            </span>
          </>
        }
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-[12px] text-fg-2">
          <span className="tnum">Page {currentPage} of {totalPages}</span>
          <div className="flex gap-2">
            <Button
              variant="secondary" size="sm"
              icon={<ChevronLeft size={13} />}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              Previous
            </Button>
            <Button
              variant="secondary" size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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
            value={formData.type || 'TRUCK'}
            onChange={e => setFormData({ ...formData, type: e.target.value as any })}
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
          {formData.type === 'TRUCK' && (
            <div className="md:col-span-2">
              <Select
                label="Assigned driver"
                value={formData.assignedDriverId || ''}
                onChange={e => setFormData({ ...formData, assignedDriverId: e.target.value || undefined })}
                options={[
                  { value: '', label: 'Unassigned' },
                  ...drivers.map(d => ({ value: d.id, label: d.name })),
                ]}
              />
            </div>
          )}
        </form>
      </Modal>

      {deleteItem && (
        <ConfirmModal
          isOpen={!!deleteItem}
          title="Delete equipment"
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
