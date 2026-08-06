import React, { useState, useMemo } from 'react';
import { Customer, Invoice, PaymentOption } from '../../types/tms';
import { useAuth } from '../../context/AuthContext';
import { mockStore } from '../../services/mockStore';
import { useToast } from '../ui/Toast';
import { ConfirmModal } from '../ui/ConfirmModal';
import {
  Button, Input, Select, Modal, PageHeader, DataTable,
  StatCard, TopListCard, StatusPill, EmptyState, FilterBar, FilterChips, FilterSearch,
} from '../ui';
import type { Column, TopListItem } from '../ui';
import { Building2, Plus, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

interface CustomersViewProps {
  customers: Customer[];
  invoices: Invoice[];
  onReload: () => void;
}

/** "$142.5k" beats "$142,500.00" in a quarter-width card. */
const compactUsd = (minor: number) => {
  const d = minor / 100;
  if (d >= 1_000_000) return `$${(d / 1_000_000).toFixed(1)}m`;
  if (d >= 1_000) return `$${(d / 1_000).toFixed(1)}k`;
  return `$${Math.round(d)}`;
};

const ITEMS_PER_PAGE = 15;

const STATUS_OPTIONS = [
  { value: 'All', label: 'All' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
];

const PAYMENT_OPTIONS: { value: PaymentOption; label: string }[] = [
  { value: 'CHECK', label: 'Check' },
  { value: 'DEPOSIT', label: 'Deposit' },
  { value: 'FACTORING', label: 'Factoring' },
];

const paymentLabel = (v?: PaymentOption) => PAYMENT_OPTIONS.find(o => o.value === v)?.label;

/** Billed but not settled. Drafts are not owed yet and voids never will be. */
const isOutstanding = (inv: Invoice) =>
  inv.status !== 'PAID' && inv.status !== 'VOID' && inv.status !== 'DRAFT';

export const CustomersView: React.FC<CustomersViewProps> = ({ customers, invoices, onReload }) => {
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
      const haystack = [
        customer.name, customer.contactPerson, customer.contactEmail,
        customer.mcNumber, customer.dotNumber,
      ].filter(Boolean).join(' ');
      const matchSearch = haystack.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' ? true : statusFilter === 'Active' ? customer.isActive : !customer.isActive;
      return matchSearch && matchStatus;
    });
  }, [customers, search, statusFilter]);

  // KPI strip mirrors the Loads view: one hero card anchoring three quiet ones.
  const kpiData = useMemo(() => {
    const active = customers.filter(c => c.isActive).length;
    const total = customers.length;
    const withMc = customers.filter(c => !!c.mcNumber).length;
    return { total, active, withMc };
  }, [customers]);

  /**
   * Accounts carrying a balance, not invoices carrying one — the collections
   * call is placed per customer, so the number that matters is how many brokers
   * owe, with the money and the overdue share as the detail underneath.
   */
  const unpaid = useMemo(() => {
    const owed = new Map<string, number>();
    const overdueKeys = new Set<string>();
    for (const inv of invoices) {
      if (!isOutstanding(inv)) continue;
      const key = inv.customerId || inv.customerName;
      owed.set(key, (owed.get(key) ?? 0) + (inv.totalMinor - (inv.paidAmountMinor ?? 0)));
      if (inv.status === 'OVERDUE') overdueKeys.add(key);
    }
    const amount = [...owed.values()].reduce((s, v) => s + v, 0);
    return { accounts: owed.size, amount, overdueAccounts: overdueKeys.size };
  }, [invoices]);

  /**
   * Ranked on billed revenue (voids excluded), not collections: it answers "who
   * is the book actually built on", which is the question that decides where a
   * rate concession or a credit-limit bump is worth making. Keyed on customerId
   * with a name fallback so manually-entered invoices still roll up.
   */
  const topClients = useMemo(() => {
    const totals = new Map<string, { name: string; revenue: number }>();
    for (const inv of invoices) {
      if (inv.status === 'VOID') continue;
      const key = inv.customerId || inv.customerName;
      const prev = totals.get(key);
      totals.set(key, { name: inv.customerName, revenue: (prev?.revenue ?? 0) + inv.totalMinor });
    }
    const ranked = [...totals.entries()].sort((a, b) => b[1].revenue - a[1].revenue);
    const book = ranked.reduce((sum, [, v]) => sum + v.revenue, 0);
    const items: TopListItem[] = ranked.slice(0, 5).map(([id, v]) => ({
      id,
      label: v.name,
      value: compactUsd(v.revenue),
      weight: v.revenue,
    }));
    const share = book ? Math.round((items.reduce((s, i) => s + i.weight, 0) / book) * 100) : 0;
    return { items, share, accounts: ranked.length };
  }, [invoices]);

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
      // New accounts open active; pausing one is a click on the status pill.
      setFormData({
        isActive: true,
        paymentOption: 'CHECK',
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

  // Same click-the-pill affordance as the fleet roster: pausing an account is a
  // one-field change and shouldn't cost a trip through the edit form.
  const handleActiveChange = async (c: Customer, isActive: boolean) => {
    if (!currentUser) return;
    try {
      await mockStore.updateCustomer(c.id, { isActive }, currentUser);
      showToast('success', `${c.name} set to ${isActive ? 'Active' : 'Inactive'}`);
      onReload();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to update status');
    }
  };

  const formatCurrency = (minorUnits?: number) => {
    if (minorUnits === undefined) return '$0.00';
    return '$' + (minorUnits / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleCreditLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    // Blank clears the field rather than recording a $0 limit — "no limit on
    // file" and "this broker may not be extended a cent" are not the same note.
    setFormData({ ...formData, creditLimitMinor: isNaN(value) ? undefined : Math.round(value * 100) });
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
      render: (c) => <span className="font-medium">{c.contactPerson || <span className="text-fg-3">—</span>}</span>,
    },
    {
      key: 'phoneEmail',
      header: 'Phone / Email',
      width: '18%',
      render: (c) => (
        c.contactPhone || c.contactEmail ? (
          <>
            <span className="font-medium tnum">{c.contactPhone || '—'}</span>
            <span className="block text-[11px] text-fg-3 mt-px">{c.contactEmail || '—'}</span>
          </>
        ) : <span className="text-fg-3">—</span>
      ),
    },
    {
      key: 'mc',
      header: 'MC / DOT #',
      width: '11%',
      render: (c) => (
        <>
          <span className="block text-fg-2 text-[12px] tnum">{c.mcNumber || '—'}</span>
          <span className="block text-[11px] text-fg-3 mt-px tnum">
            {c.dotNumber ? `DOT ${c.dotNumber}` : 'No DOT #'}
          </span>
        </>
      ),
    },
    {
      key: 'credit',
      header: 'Credit limit',
      width: '12%',
      render: (c) => (
        c.creditLimitMinor
          ? <span className="font-semibold text-pos tnum">{formatCurrency(c.creditLimitMinor)}</span>
          : <span className="text-fg-3">Not set</span>
      ),
    },
    {
      key: 'payment',
      header: 'Payment',
      width: '9%',
      render: (c) => <span>{paymentLabel(c.paymentOption) || <span className="text-fg-3">—</span>}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      width: '11%',
      render: (c) => (
        <StatusPill
          value={c.isActive ? 'ACTIVE' : 'INACTIVE'}
          options={[{ value: 'ACTIVE' }, { value: 'INACTIVE' }]}
          subject={c.name}
          onChange={(next) => handleActiveChange(c, next === 'ACTIVE')}
        />
      ),
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
        title="Brokers & Customers"
        subtitle="Authorities, payment options, credit limits, & outstanding balances."
        actions={
          <Button icon={<Plus size={13} />} onClick={() => handleOpenModal()}>
            Add customer / broker
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard
          label="Broker & customer accounts"
          value={String(kpiData.total)}
          sub={`${kpiData.active} active · ${kpiData.total - kpiData.active} inactive`}
        />
        <TopListCard
          label="Top clients by revenue"
          items={topClients.items}
          emptyText="No invoices billed yet"
          sub={
            topClients.items.length
              ? `${topClients.share}% of billed revenue across ${topClients.accounts} accounts`
              : undefined
          }
        />
        <StatCard
          label="Unpaid customers"
          value={String(unpaid.accounts)}
          sub={
            unpaid.accounts === 0
              ? 'Every account is settled'
              : unpaid.overdueAccounts > 0
                ? <span className="text-danger font-semibold">
                    {compactUsd(unpaid.amount)} owed · {unpaid.overdueAccounts} overdue
                  </span>
                : `${compactUsd(unpaid.amount)} owed, none overdue`
          }
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
            label="DOT number*"
            required
            className="tnum"
            hint="The authority the account is vetted on"
            value={formData.dotNumber || ''}
            onChange={e => setFormData({ ...formData, dotNumber: e.target.value })}
          />
          <Input
            label="MC number"
            className="tnum"
            value={formData.mcNumber || ''}
            onChange={e => setFormData({ ...formData, mcNumber: e.target.value })}
          />
          <div className="md:col-span-2">
            <Input
              label="Billing address*"
              required
              value={formData.billingAddress || ''}
              onChange={e => setFormData({ ...formData, billingAddress: e.target.value })}
            />
          </div>
          <Input
            label="Contact person"
            value={formData.contactPerson || ''}
            onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
          />
          <Input
            label="Contact email"
            type="email"
            value={formData.contactEmail || ''}
            onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
          />
          <Input
            label="Contact phone"
            value={formData.contactPhone || ''}
            onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
          />
          <Select
            label="Payment options*"
            required
            options={PAYMENT_OPTIONS}
            value={formData.paymentOption || 'CHECK'}
            onChange={e => setFormData({ ...formData, paymentOption: e.target.value as PaymentOption })}
          />
          <div className="md:col-span-2">
            <Input
              label="Credit limit ($)"
              type="number"
              step="0.01"
              min="0"
              className="tnum"
              hint="Optional — leave blank if no limit is set"
              value={formData.creditLimitMinor !== undefined ? formData.creditLimitMinor / 100 : ''}
              onChange={handleCreditLimitChange}
            />
          </div>
        </form>
      </Modal>

      {deleteItem && (
        <ConfirmModal
          isOpen={!!deleteItem}
          title="Delete customer account"
          message={`Deleting ${deleteItem.name} removes the broker record and its credit terms. This action cannot be undone.`}
          confirmPhrase={deleteItem.name}
          confirmNoun="customer name"
          confirmLabel="Delete customer"
          isDanger={true}
          onConfirm={handleDelete}
          onCancel={() => setDeleteItem(null)}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};
