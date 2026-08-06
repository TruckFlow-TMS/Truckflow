import React, { useState, useMemo } from 'react';
import { CdlEndorsement, Driver, DriverDocument, DriverDocumentType } from '../../types/tms';
import { useAuth } from '../../context/AuthContext';
import { mockStore } from '../../services/mockStore';
import { useToast } from '../ui/Toast';
import { ConfirmModal } from '../ui/ConfirmModal';
import {
  Button, Input, Select, Modal, PageHeader, DataTable, Badge, Avatar,
  StatCard, EmptyState, FilterBar, FilterChips, FilterSearch, FormSection,
  statusTone, humanizeStatus,
} from '../ui';
import type { Column } from '../ui';
import {
  Users, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, Upload, Paperclip, Eye,
  User, Briefcase, CreditCard, DollarSign,
} from 'lucide-react';

interface DriversViewProps {
  drivers: Driver[];
  onReload: () => void;
}

const ITEMS_PER_PAGE = 15;

const STATUS_OPTIONS = [
  { value: 'All', label: 'All' },
  { value: 'AVAILABLE', label: 'Active' },
  { value: 'ON_LOAD', label: 'On load' },
  { value: 'INACTIVE', label: 'Inactive' },
];

/**
 * A driver profile is set to Active or Inactive by hand; On load is applied by
 * dispatch when a driver is assigned, so it is not an option in the form.
 */
const FORM_STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

const ENDORSEMENT_OPTIONS: { value: CdlEndorsement; label: string }[] = [
  { value: 'HAZMAT', label: 'Hazmat' },
  { value: 'TANKER', label: 'Tanker' },
];

const DRIVER_DOC_TYPES: { type: DriverDocumentType; label: string }[] = [
  { type: 'DRIVER_ID', label: 'Driver ID' },
  { type: 'MEDICAL_CARD', label: 'Medical card' },
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
  // Clamped so a result set that shrinks under the current page (narrowed
  // filter, deleted row) falls back to the last real page instead of slicing
  // past the end and showing the empty state over rows that do exist.
  const page = Math.min(currentPage, totalPages);
  const paginatedDrivers = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredDrivers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredDrivers, page]);

  const handleOpenModal = (driver?: Driver) => {
    if (driver) {
      setEditItem(driver);
      setFormData(driver);
    } else {
      setEditItem(null);
      setFormData({
        status: 'AVAILABLE',
        employmentType: 'COMPANY_DRIVER',
        // Seeded rather than left to the Select's fallback display, or a driver
        // saved without touching the field would persist no class at all.
        cdlClass: 'A',
        cdlEndorsements: [],
        documents: [],
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

  const isOwnerOperator = formData.employmentType === 'OWNER_OPERATOR';
  const ssnValue = formData.socialSecurityNumber || '';
  const ssnIncomplete = ssnValue.length > 0 && ssnValue.length < 9;

  const toggleEndorsement = (endorsement: CdlEndorsement) => {
    const current = formData.cdlEndorsements || [];
    setFormData({
      ...formData,
      cdlEndorsements: current.includes(endorsement)
        ? current.filter((e) => e !== endorsement)
        : [...current, endorsement],
    });
  };

  const findDoc = (type: DriverDocumentType): DriverDocument | undefined =>
    (formData.documents || []).find((d) => d.type === type);

  const handleDocUpload = (type: DriverDocumentType, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const doc: DriverDocument = {
      type,
      name: file.name,
      // Object URLs live only as long as the tab does — same trade-off the load
      // and company document uploads make in this mock-backed build.
      fileUrl: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString(),
    };
    setFormData({
      ...formData,
      documents: [...(formData.documents || []).filter((d) => d.type !== type), doc],
    });
    e.target.value = '';
  };

  const handleDocRemove = (type: DriverDocumentType) => {
    setFormData({
      ...formData,
      documents: (formData.documents || []).filter((d) => d.type !== type),
    });
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
            aria-label={`Edit ${d.name}`}
            className="p-1.5 rounded-ctl text-fg-3 hover:text-accent hover:bg-surface-2 transition-colors"
          >
            <Edit2 size={15} />
          </button>
          <button
            onClick={() => setDeleteItem(d)}
            title="Delete"
            aria-label={`Delete ${d.name}`}
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
          sub={`${kpiData.available} active · ${kpiData.onLoad} on a load`}
        />
        <StatCard
          label="Active now"
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
        <form id="driver-form" onSubmit={handleSave} className="space-y-6">
          <FormSection title="Identity & contact" icon={<User size={13} className="text-accent" />}>
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
                label="Address*"
                required
                value={formData.address || ''}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <Input
              label="Social security number*"
              required
              inputMode="numeric"
              autoComplete="off"
              maxLength={9}
              // Exactly nine digits or nothing gets saved: `required` blocks the
              // empty case, the pattern blocks a half-typed one.
              pattern="[0-9]{9}"
              placeholder="9 digits"
              hint={ssnIncomplete ? undefined : 'Digits only, no dashes'}
              error={ssnIncomplete ? `${ssnValue.length} of 9 digits` : undefined}
              className="tnum"
              value={ssnValue}
              // Digits are stripped on the way in, so a pasted 123-45-6789
              // still lands as a clean nine-digit value.
              onChange={e => setFormData({
                ...formData,
                socialSecurityNumber: e.target.value.replace(/\D/g, '').slice(0, 9),
              })}
            />
          </FormSection>

          <FormSection title="Employment" icon={<Briefcase size={13} className="text-accent" />}>
            <Select
              label="Employment type*"
              required
              value={formData.employmentType || 'COMPANY_DRIVER'}
              // Switching back to company driver drops the business details
              // rather than hiding them and saving them anyway.
              onChange={e => {
                const employmentType = e.target.value as Driver['employmentType'];
                setFormData(employmentType === 'OWNER_OPERATOR'
                  ? { ...formData, employmentType }
                  : { ...formData, employmentType, businessName: undefined, einNumber: undefined });
              }}
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
              // A driver already out on a load keeps that status rather than being
              // silently reset to Active by an unrelated profile edit.
              options={
                formData.status === 'ON_LOAD'
                  ? [...FORM_STATUS_OPTIONS, { value: 'ON_LOAD', label: 'On load' }]
                  : FORM_STATUS_OPTIONS
              }
            />

            {/* Owner operators run under their own authority, so they carry a
                business identity a company driver has no use for. */}
            {isOwnerOperator && (
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 rounded-ctl border border-bd bg-surface-2 p-3">
                <div className="md:col-span-2 flex items-center justify-between gap-3">
                  <span className="text-[11.5px] font-semibold text-fg">Business details</span>
                  <span className="text-[10.5px] text-fg-3">Owner operators · both optional</span>
                </div>
                <Input
                  label="Business name"
                  placeholder="e.g. Kowalski Trucking LLC"
                  value={formData.businessName || ''}
                  onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                />
                <Input
                  label="EIN number"
                  inputMode="numeric"
                  placeholder="12-3456789"
                  className="tnum"
                  value={formData.einNumber || ''}
                  onChange={e => setFormData({ ...formData, einNumber: e.target.value })}
                />
              </div>
            )}
          </FormSection>

          <FormSection title="CDL & qualifications" icon={<CreditCard size={13} className="text-accent" />}>
            <Input
              label="CDL number*"
              required
              value={formData.cdlNumber || ''}
              onChange={e => setFormData({ ...formData, cdlNumber: e.target.value })}
            />
            <Select
              label="CDL class*"
              required
              value={formData.cdlClass || 'A'}
              onChange={e => setFormData({ ...formData, cdlClass: e.target.value })}
              options={[{ value: 'A', label: 'Class A' }]}
            />

            <div className="md:col-span-2 space-y-1.5">
              <span className="block text-[11.5px] font-medium text-fg-2">Endorsements</span>
              <div className="flex flex-wrap gap-2">
                {ENDORSEMENT_OPTIONS.map(({ value, label }) => {
                  const checked = (formData.cdlEndorsements || []).includes(value);
                  return (
                    <label
                      key={value}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-ctl border text-[12px] font-medium cursor-pointer transition ${
                        checked
                          ? 'border-accent bg-accent-weak text-accent'
                          : 'border-bd bg-surface text-fg-2 hover:border-accent/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        aria-label={label}
                        className="accent-current"
                        checked={checked}
                        onChange={() => toggleEndorsement(value)}
                      />
                      {label}
                    </label>
                  );
                })}
              </div>
            </div>

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
          </FormSection>

          <FormSection title="Pay" icon={<DollarSign size={13} className="text-accent" />}>
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
          </FormSection>

          <FormSection
            title="Documents"
            icon={<Paperclip size={13} className="text-accent" />}
            aside="Optional"
          >
            {DRIVER_DOC_TYPES.map(({ type, label }) => {
              const doc = findDoc(type);
              return (
                <div key={type} className="p-3 rounded-ctl border border-bd bg-surface-2 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-fg text-[12.5px]">{label}</span>
                    <Badge tone={doc ? 'pos' : 'neutral'} dot={false}>
                      {doc ? 'Uploaded' : 'Not uploaded'}
                    </Badge>
                  </div>

                  {doc ? (
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-bd/60 text-[11.5px]">
                      <span className="inline-flex items-center gap-1.5 text-accent font-medium min-w-0">
                        <Paperclip size={12} className="shrink-0" />
                        <span className="truncate">{doc.name}</span>
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded text-fg-3 hover:text-accent hover:bg-surface-2 transition-colors"
                          title={`View ${label.toLowerCase()}`}
                        >
                          <Eye size={14} />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDocRemove(type)}
                          className="p-1 rounded text-fg-3 hover:text-danger hover:bg-surface-2 transition-colors"
                          title="Remove file"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="inline-flex items-center justify-center gap-1.5 w-full px-3 py-1.5 rounded-ctl border border-dashed border-bd-strong bg-surface hover:bg-surface-2 cursor-pointer text-[11.5px] font-medium text-fg-2 hover:text-accent transition">
                      <Upload size={13} className="text-accent" />
                      <span>Choose file…</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => handleDocUpload(type, e)}
                      />
                    </label>
                  )}
                </div>
              );
            })}
          </FormSection>
        </form>
      </Modal>

      {deleteItem && (
        <ConfirmModal
          isOpen={!!deleteItem}
          title="Delete driver"
          message={`Deleting ${deleteItem.name} removes their profile, credentials and uploaded documents. This action cannot be undone.`}
          confirmPhrase={deleteItem.name}
          confirmNoun="driver name"
          confirmLabel="Delete driver"
          isDanger={true}
          onConfirm={handleDelete}
          onCancel={() => setDeleteItem(null)}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};
