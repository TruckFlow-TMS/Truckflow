import React, { useState, useMemo } from 'react';
import { Customer } from '../../types/tms';
import { useAuth } from '../../context/AuthContext';
import { mockStore } from '../../services/mockStore';
import { useToast } from '../ui/Toast';
import { ConfirmModal } from '../ui/ConfirmModal';
import {
  Button, Input, Select, Modal, PageHeader, DataTable, Badge,
  StatCard, EmptyState, FilterBar, FilterChips, FilterSearch,
  statusTone, humanizeStatus,
} from '../ui';
import type { Column } from '../ui';
import { Building2, Plus, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

interface CustomersViewProps {
  customers: Customer[];
  onReload: () => void;
}

const ITEMS_PER_PAGE = 15;

const STATUS_OPTIONS = [
  { value: 'All', label: 'All' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
];

export const CustomersView: React.FC<CustomersViewProps> = ({ customers, onReload }) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Customer | null>(null);
  const [deleteItem, setDeleteItem] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Customer>>({});

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const matchSearch = (customer.name + ' ' + customer.contactPerson + ' ' + customer.contactEmail + ' ' + (customer.mcNumber||'')).toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' ? true : statusFilter === 'Active' ? customer.isActive : !customer.isActive;
      return matchSearch && matchStatus;
    });
  }, [customers, search, statusFilter]);

  // KPI strip mirrors the Loads view: one hero card anchoring three quiet ones.
  const kpiData = useMemo(() => {
    const active = customers.filter(c => c.isActive).length;
    const total = customers.length;
    const activePct = total ? Math.round((active / total) * 1000) / 10 : 0;
    const withMc = customers.filter(c => !!c.mcNumber).length;
    const terms = customers.filter(c => typeof c.paymentTermsDays === 'number');
    const avgTerms = terms.length
      ? Math.round(terms.reduce((sum, c) => sum + (c.paymentTermsDays ?? 0), 0) / terms.length)
      : 0;
    return { total, active, activePct, withMc, avgTerms };
  }, [customers]);

  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE) || 1;
  // Clamped so a result set that shrinks under the current page (narrowed
  // filter, deleted row) falls back to the last real page instead of slicing
  // past the end and showing the empty state over rows that do exist.
  const page = Math.min(currentPage, totalPages);
  const paginatedCustomers = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredCustomers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCustomers, page]);

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditItem(customer);
      setFormData(customer);
    } else {
      setEditItem(null);
      setFormData({
        isActive: true,
        paymentTermsDays: 30
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
        await mockStore.updateCustomer(editItem.id, formData, currentUser);
        showToast('success', 'Customer updated successfully');
      } else {
        await mockStore.createCustomer(formData as Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>, currentUser);
        showToast('success', 'Customer created successfully');
      }
      onReload();
      handleCloseModal();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to save customer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUser || !deleteItem) return;

    setIsLoading(true);
    try {
      await mockStore.deleteCustomer(deleteItem.id, currentUser);
      showToast('success', 'Customer deleted successfully');
      onReload();
      setDeleteItem(null);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to delete customer');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (minorUnits?: number) => {
    if (minorUnits === undefined) return '$0.00';
    return '$' + (minorUnits / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleCreditLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setFormData({ ...formData, creditLimitMinor: isNaN(value) ? 0 : Math.round(value * 100) });
  };

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      header: 'Company name',
      width: '18%',
      render: (c) => (
        <>
          <span className="font-semibold">{c.name}</span>
          <span className="block text-[11px] text-fg-3 mt-px">{[c.city, c.state].filter(Boolean).join(', ') || '—'}</span>
        </>
      ),
    },
    {
      key: 'contact',
      header: 'Contact person',
      width: '14%',
      render: (c) => <span className="font-medium">{c.contactPerson}</span>,
    },
    {
      key: 'phoneEmail',
      header: 'Phone / Email',
      width: '18%',
      render: (c) => (
        <>
          <span className="font-medium tnum">{c.contactPhone}</span>
          <span className="block text-[11px] text-fg-3 mt-px">{c.contactEmail}</span>
        </>
      ),
    },
    {
      key: 'mc',
      header: 'MC / DOT #',
      width: '11%',
      render: (c) => <span className="text-fg-2 text-[12px] tnum">{c.mcNumber || '—'}</span>,
    },
    {
      key: 'credit',
      header: 'Credit limit',
      width: '12%',
      render: (c) => <span className="font-semibold text-pos tnum">{formatCurrency(c.creditLimitMinor)}</span>,
    },
    {
      key: 'terms',
      header: 'Terms',
      width: '9%',
      render: (c) => <span className="tnum">{c.paymentTermsDays} days</span>,
    },
    {
      key: 'status',
      header: 'Status',
      width: '10%',
      render: (c) => {
        const status = c.isActive ? 'ACTIVE' : 'INACTIVE';
        return <Badge tone={statusTone(status)}>{humanizeStatus(status)}</Badge>;
      },
    },
    {
      key: 'actions',
      header: '',
      width: '8%',
      align: 'right',
      render: (c) => (
        <div className="flex items-center justify-end gap-0.5">
          <button
            onClick={() => handleOpenModal(c)}
            title="Edit"
            aria-label={`Edit ${c.name}`}
            className="p-1.5 rounded-ctl text-fg-3 hover:text-accent hover:bg-surface-2 transition-colors"
          >
            <Edit2 size={15} />
          </button>
          <button
            onClick={() => setDeleteItem(c)}
            title="Delete"
            aria-label={`Delete ${c.name}`}
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
        title="Broker partners & customer accounts"
        subtitle="Credit limits, payment terms, historical average days-to-pay, & broker ratings."
        actions={
          <Button icon={<Plus size={13} />} onClick={() => handleOpenModal()}>
            Add customer / broker
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          variant="hero"
          label="Broker & customer accounts"
          value={String(kpiData.total)}
          sub={`${kpiData.active} active · ${kpiData.total - kpiData.active} inactive`}
        />
        <StatCard
          label="Authorities on file"
          value={String(kpiData.withMc)}
          sub={
            kpiData.withMc < kpiData.total
              ? <span className="text-warn font-semibold">{kpiData.total - kpiData.withMc} missing an MC number</span>
              : 'Every account has an MC number'
          }
        />
        <StatCard
          variant="ring"
          ringPct={kpiData.activePct}
          label="Active accounts"
          value={`${kpiData.activePct}%`}
          sub="Cleared to book freight"
        />
        <StatCard
          label="Average payment terms"
          value={`${kpiData.avgTerms} days`}
          sub="Net terms across the book"
        />
      </div>

      <DataTable
        columns={columns}
        rows={paginatedCustomers}
        rowKey={(c) => c.id}
        empty={
          <EmptyState
            icon={<Building2 size={30} strokeWidth={1.5} />}
            title="No customer accounts found"
            sub="Try a different status or search term."
            action={
              <Button icon={<Plus size={13} />} onClick={() => handleOpenModal()}>
                Add customer / broker
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
                placeholder="Search company name, contact, MC#…"
              />
            }
            meta={`Showing ${paginatedCustomers.length} of ${filteredCustomers.length}`}
            chips={
              <FilterChips
                label="Filter accounts by status"
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

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editItem ? 'Edit customer account' : 'Add new customer / broker'}
        busy={isLoading}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit" form="customer-form" loading={isLoading}>
              {isLoading ? 'Saving…' : 'Save customer'}
            </Button>
          </>
        }
      >
        <form id="customer-form" onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Company name*"
              required
              value={formData.name || ''}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <Input
            label="Contact person*"
            required
            value={formData.contactPerson || ''}
            onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
          />
          <Input
            label="Contact email*"
            required
            type="email"
            value={formData.contactEmail || ''}
            onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
          />
          <Input
            label="Contact phone*"
            required
            value={formData.contactPhone || ''}
            onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
          />
          <Input
            label="MC number"
            value={formData.mcNumber || ''}
            onChange={e => setFormData({ ...formData, mcNumber: e.target.value })}
          />
          <div className="md:col-span-2">
            <Input
              label="Billing address"
              value={formData.billingAddress || ''}
              onChange={e => setFormData({ ...formData, billingAddress: e.target.value })}
            />
          </div>
          <Input
            label="Payment terms (days)*"
            required
            type="number"
            value={formData.paymentTermsDays ?? ''}
            onChange={e => setFormData({ ...formData, paymentTermsDays: Number(e.target.value) })}
          />
          <Input
            label="Credit limit ($)*"
            required
            type="number"
            step="0.01"
            value={formData.creditLimitMinor !== undefined ? formData.creditLimitMinor / 100 : ''}
            onChange={handleCreditLimitChange}
          />
          <div className="md:col-span-2 flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActive"
              className="rounded border-bd bg-surface-2 text-accent focus:ring-accent"
              checked={formData.isActive || false}
              onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
            />
            <label htmlFor="isActive" className="text-[13px] text-fg-2 font-medium">Active customer account</label>
          </div>
        </form>
      </Modal>

      {deleteItem && (
        <ConfirmModal
          isOpen={!!deleteItem}
          title="Delete customer account"
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
