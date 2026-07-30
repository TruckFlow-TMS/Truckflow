import React, { useState, useMemo } from 'react';
import { Driver } from '../../types/tms';
import { useAuth } from '../../context/AuthContext';
import { mockStore } from '../../services/mockStore';
import { useToast } from '../ui/Toast';
import { ConfirmModal } from '../ui/ConfirmModal';
import {
  Button, Input, Select, Modal, PageHeader, DataTable, Badge, Avatar,
  StatCard, EmptyState, FilterBar, FilterChips, FilterSearch,
  statusTone, humanizeStatus,
} from '../ui';
import type { Column } from '../ui';
import { Users, Plus, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

interface DriversViewProps {
  drivers: Driver[];
  onReload: () => void;
}

const ITEMS_PER_PAGE = 15;

const STATUS_OPTIONS = [
  { value: 'All', label: 'All' },
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'ON_LOAD', label: 'On load' },
  { value: 'INACTIVE', label: 'Inactive' },
];

const TYPE_OPTIONS = [
  { value: 'All', label: 'All types' },
  { value: 'COMPANY_DRIVER', label: 'Company' },
  { value: 'OWNER_OPERATOR', label: 'Owner operator' },
];

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

  // KPI strip mirrors the Loads view: one hero card anchoring three quiet ones.
  const kpiData = useMemo(() => {
    const available = drivers.filter(d => d.status === 'AVAILABLE').length;
    const onLoad = drivers.filter(d => d.status === 'ON_LOAD').length;
    const total = drivers.length;
    const utilisation = total ? Math.round((onLoad / total) * 1000) / 10 : 0;
    // Credentials lapsing inside 30 days — the number a compliance officer wants.
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + 30);
    const expiring = drivers.filter(d =>
      [d.cdlExpiration, d.medicalCardExpiration].some(date => {
        if (!date) return false;
        const when = new Date(date);
        return when <= cutoff;
      }),
    ).length;
    return { total, available, onLoad, utilisation, expiring };
  }, [drivers]);

  const totalPages = Math.ceil(filteredDrivers.length / ITEMS_PER_PAGE) || 1;
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

  const columns: Column<Driver>[] = [
    {
      key: 'name',
      header: 'Driver name',
      width: '20%',
      render: (d) => (
        <span className="inline-flex items-center gap-2">
          <Avatar name={d.name} />
          <span>
            <span className="font-semibold">{d.name}</span>
            <span className="block text-[11px] text-fg-3 mt-px">{d.address || 'Address on file'}</span>
          </span>
        </span>
      ),
    },
    {
      key: 'contact',
      header: 'Phone / Email',
      width: '17%',
      render: (d) => (
        <>
          <span className="font-medium tnum">{d.phone}</span>
          <span className="block text-[11px] text-fg-3 mt-px">{d.email}</span>
        </>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      width: '13%',
      render: (d) => (
        <span className="px-2 py-0.5 rounded text-[10.5px] font-medium bg-surface-2 text-fg-2 border border-bd">
          {d.employmentType === 'COMPANY_DRIVER' ? 'Company driver' : 'Owner operator'}
        </span>
      ),
    },
    {
      key: 'cdl',
      header: 'CDL # & expiration',
      width: '20%',
      render: (d) => (
        <>
          <span className="font-medium tnum">{d.cdlNumber} ({d.cdlClass})</span>
          <span className="flex items-center gap-1.5 mt-px">
            <span className="text-[11px] text-fg-3 tnum">Exp: {d.cdlExpiration}</span>
            {isCdlExpired(d.cdlExpiration) && (
              <Badge tone="danger" dot={false}>Expired</Badge>
            )}
          </span>
        </>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '12%',
      render: (d) => (
        <Badge tone={statusTone(d.status)}>{humanizeStatus(d.status)}</Badge>
      ),
    },
    {
      key: 'payRate',
      header: 'Pay rate',
      width: '10%',
      render: (d) => (
        <>
          <span className="font-semibold tnum">
            {d.payRateType === 'FLAT_PERCENT' ? `${d.payRateMinor}%` : `$${(d.payRateMinor / 100).toFixed(2)}`}
          </span>
          <span className="block text-[11px] text-fg-3 mt-px">
            {d.payRateType === 'PER_MILE' ? '/ mile' : d.payRateType === 'PER_HOUR' ? '/ hr' : 'gross'}
          </span>
        </>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '8%',
      align: 'right',
      render: (d) => (
        <div className="flex items-center justify-end gap-0.5">
          <button
            onClick={() => handleOpenModal(d)}
            title="Edit"
            className="p-1.5 rounded-ctl text-fg-3 hover:text-accent hover:bg-surface-2 transition-colors"
          >
            <Edit2 size={15} />
          </button>
          <button
            onClick={() => setDeleteItem(d)}
            title="Delete"
            className="p-1.5 rounded-ctl text-fg-3 hover:text-danger hover:bg-surface-2 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3.5">
      <PageHeader
        title="Driver roster & qualifications"
        subtitle="CDL credentials, medical cards, pay rate profiles, and assignment status."
        actions={
          <Button icon={<Plus size={13} />} onClick={() => handleOpenModal()}>
            Add driver
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          variant="hero"
          label="Drivers on the roster"
          value={String(kpiData.total)}
          sub={`${kpiData.available} available · ${kpiData.onLoad} on a load`}
        />
        <StatCard
          label="Available now"
          value={String(kpiData.available)}
          sub="Ready to be dispatched"
        />
        <StatCard
          variant="ring"
          ringPct={kpiData.utilisation}
          label="Utilisation"
          value={`${kpiData.utilisation}%`}
          sub="Currently running a load"
        />
        <StatCard
          label="Credentials expiring"
          value={String(kpiData.expiring)}
          sub={
            kpiData.expiring > 0
              ? <span className="text-warn font-semibold">CDL or medical within 30 days</span>
              : 'All current'
          }
        />
      </div>

      <DataTable
        columns={columns}
        rows={paginatedDrivers}
        rowKey={(d) => d.id}
        empty={
          <EmptyState
            icon={<Users size={30} strokeWidth={1.5} />}
            title="No drivers found"
            sub="Try a different status, type or search term."
            action={
              <Button icon={<Plus size={13} />} onClick={() => handleOpenModal()}>
                Add driver
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
                placeholder="Search name, phone, or CDL number…"
              />
            }
            extra={
              <FilterChips
                label="Filter drivers by employment type"
                value={typeFilter}
                onChange={(v) => { setTypeFilter(v); setCurrentPage(1); }}
                options={TYPE_OPTIONS}
              />
            }
            meta={`Showing ${paginatedDrivers.length} of ${filteredDrivers.length}`}
            chips={
              <FilterChips
                label="Filter drivers by status"
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

      {/* Add / Edit Driver Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editItem ? 'Edit driver profile' : 'Add new driver'}
        busy={isLoading}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit" form="driver-form" loading={isLoading}>
              {isLoading ? 'Saving…' : 'Save driver'}
            </Button>
          </>
        }
      >
        <form id="driver-form" onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Full name*"
              required
              value={formData.name || ''}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <Input
            label="Email*"
            required
            type="email"
            value={formData.email || ''}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
          />
          <Input
            label="Phone*"
            required
            value={formData.phone || ''}
            onChange={e => setFormData({ ...formData, phone: e.target.value })}
          />
          <div className="md:col-span-2">
            <Input
              label="Address"
              value={formData.address || ''}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          <Select
            label="Employment type*"
            required
            value={formData.employmentType || 'COMPANY_DRIVER'}
            onChange={e => setFormData({ ...formData, employmentType: e.target.value as any })}
            options={[
              { value: 'COMPANY_DRIVER', label: 'Company driver' },
              { value: 'OWNER_OPERATOR', label: 'Owner operator' },
            ]}
          />
          <Select
            label="Status*"
            required
            value={formData.status || 'AVAILABLE'}
            onChange={e => setFormData({ ...formData, status: e.target.value as any })}
            options={[
              { value: 'AVAILABLE', label: 'Available' },
              { value: 'ON_LOAD', label: 'On load' },
              { value: 'INACTIVE', label: 'Inactive' },
            ]}
          />
          <Input
            label="CDL number*"
            required
            value={formData.cdlNumber || ''}
            onChange={e => setFormData({ ...formData, cdlNumber: e.target.value })}
          />
          <Select
            label="CDL class"
            value={formData.cdlClass || 'A'}
            onChange={e => setFormData({ ...formData, cdlClass: e.target.value })}
            options={[
              { value: 'A', label: 'Class A' },
              { value: 'B', label: 'Class B' },
              { value: 'C', label: 'Class C' },
            ]}
          />
          <Input
            label="CDL expiration*"
            required
            type="date"
            value={formData.cdlExpiration || ''}
            onChange={e => setFormData({ ...formData, cdlExpiration: e.target.value })}
          />
          <Input
            label="Medical card expiration*"
            required
            type="date"
            value={formData.medicalCardExpiration || ''}
            onChange={e => setFormData({ ...formData, medicalCardExpiration: e.target.value })}
          />
          <Select
            label="Pay rate type*"
            required
            value={formData.payRateType || 'PER_MILE'}
            onChange={e => setFormData({ ...formData, payRateType: e.target.value as any })}
            options={[
              { value: 'PER_MILE', label: 'Per mile (cents)' },
              { value: 'FLAT_PERCENT', label: 'Flat gross %' },
              { value: 'PER_HOUR', label: 'Per hour ($)' },
            ]}
          />
          <Input
            label="Pay rate value (cents / %)*"
            required
            type="number"
            step="1"
            value={formData.payRateMinor ?? ''}
            onChange={e => setFormData({ ...formData, payRateMinor: Number(e.target.value) })}
          />
        </form>
      </Modal>

      {deleteItem && (
        <ConfirmModal
          isOpen={!!deleteItem}
          title="Delete driver"
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
