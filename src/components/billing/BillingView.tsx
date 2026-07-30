import React, { useState, useMemo } from 'react';
import { Invoice, Load, Customer } from '../../types/tms';
import { useAuth } from '../../context/AuthContext';
import { mockStore } from '../../services/mockStore';
import { useToast } from '../ui/Toast';
import {
  Button, Card, Input, Select, Modal, ConfirmModal, PageHeader, DataTable,
  Badge, StatCard, EmptyState, FilterBar, FilterChips, FilterSearch,
  statusTone, humanizeStatus,
} from '../ui';
import type { Column } from '../ui';
import {
  Plus, Edit2, Trash2, CheckCircle2, FileText, Ban,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

interface BillingViewProps {
  invoices: Invoice[];
  loads: Load[];
  customers?: Customer[];
  onReload: () => void;
}

const ITEMS_PER_PAGE = 15;

const STATUS_OPTIONS = [
  { value: 'All', label: 'All' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ISSUED', label: 'Issued' },
  { value: 'PAID', label: 'Paid' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'VOID', label: 'Void' },
];

const FORM_STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ISSUED', label: 'Issued' },
  { value: 'PAID', label: 'Paid' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'VOID', label: 'Void' },
];

export const BillingView: React.FC<BillingViewProps> = ({ invoices, loads, customers = [], onReload }) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Invoice | null>(null);
  const [voidItem, setVoidItem] = useState<Invoice | null>(null);
  const [deleteItem, setDeleteItem] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Invoice>>({});

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const customerName = customers.find(c => c.id === inv.customerId)?.name || '';
      const matchSearch = (inv.invoiceNumber + ' ' + customerName).toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' || inv.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [invoices, search, statusFilter, customers]);

  const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE) || 1;
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInvoices.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredInvoices, currentPage]);

  const kpiData = useMemo(() => {
    const totalAr = invoices.filter(i => i.status === 'ISSUED' || i.status === 'OVERDUE').reduce((acc, curr) => acc + curr.totalMinor, 0);
    const collectedThisMonth = invoices.filter(i => i.status === 'PAID').reduce((acc, curr) => acc + curr.totalMinor, 0);
    const overdueCount = invoices.filter(i => i.status === 'OVERDUE').length;
    const billed = totalAr + collectedThisMonth;
    const collectedPct = billed ? Math.round((collectedThisMonth / billed) * 1000) / 10 : 0;
    return { totalAr, collectedThisMonth, overdueCount, collectedPct };
  }, [invoices]);

  const formatCurrency = (minorUnits?: number) => {
    if (minorUnits === undefined) return '$0.00';
    return '$' + (minorUnits / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleOpenModal = (inv?: Invoice) => {
    if (inv) {
      setEditItem(inv);
      setFormData(inv);
    } else {
      setEditItem(null);
      setFormData({
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        status: 'DRAFT',
        issueDate: new Date().toISOString().split('T')[0]
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditItem(null);
    setFormData({});
  };

  const calculateDriverPay = (subtotalMinor: number) => {
    return Math.round(subtotalMinor * 0.74);
  };

  const handleSubtotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const minor = isNaN(val) ? 0 : Math.round(val * 100);
    setFormData({
      ...formData,
      subtotalMinor: minor,
      totalMinor: minor,
      driverPayMinor: calculateDriverPay(minor)
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsLoading(true);
    try {
      if (editItem) {
        await mockStore.updateInvoice(editItem.id, formData, currentUser);
        showToast('success', 'Invoice updated successfully');
      } else {
        await mockStore.createInvoice(formData as Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>, currentUser);
        showToast('success', 'Invoice created successfully');
      }
      onReload();
      handleCloseModal();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to save invoice');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkPaid = async (inv: Invoice) => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      await mockStore.markInvoicePaid(inv.id, currentUser);
      showToast('success', 'Invoice marked as paid');
      onReload();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to mark paid');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoid = async () => {
    if (!currentUser || !voidItem) return;
    setIsLoading(true);
    try {
      await mockStore.voidInvoice(voidItem.id, currentUser);
      showToast('success', 'Invoice voided');
      onReload();
      setVoidItem(null);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to void invoice');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUser || !deleteItem) return;
    setIsLoading(true);
    try {
      await mockStore.deleteInvoice(deleteItem.id, currentUser);
      showToast('success', 'Invoice deleted');
      onReload();
      setDeleteItem(null);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to delete invoice');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateInvoice = async (loadId: string) => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      await mockStore.generateInvoice(loadId, currentUser);
      showToast('success', 'Invoice generated successfully');
      onReload();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to generate invoice');
    } finally {
      setIsLoading(false);
    }
  };

  const deliveredLoadsReady = loads.filter(l => l.status === 'DELIVERED' && !invoices.some(i => i.loadId === l.id));

  const columns: Column<Invoice>[] = [
    {
      key: 'invoice',
      header: 'Invoice #',
      width: '13%',
      render: (inv) => <span className="font-semibold text-accent tnum">{inv.invoiceNumber}</span>,
    },
    {
      key: 'load',
      header: 'Load #',
      width: '10%',
      render: (inv) => (
        <span className="tnum text-fg-2">{loads.find(l => l.id === inv.loadId)?.loadNumber || '—'}</span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      width: '17%',
      render: (inv) => (
        <span className="font-medium">{customers.find(c => c.id === inv.customerId)?.name || inv.customerId || '—'}</span>
      ),
    },
    {
      key: 'dates',
      header: 'Dates',
      width: '15%',
      render: (inv) => (
        <>
          <span className="block text-[12px] tnum">Issued {inv.issueDate}</span>
          <span className="block text-[11px] text-fg-3 mt-px tnum">Due {inv.dueDate}</span>
        </>
      ),
    },
    {
      key: 'total',
      header: 'Total amount',
      width: '13%',
      align: 'right',
      render: (inv) => formatCurrency(inv.totalMinor),
    },
    {
      key: 'driverPay',
      header: 'Driver settlement',
      width: '13%',
      align: 'right',
      render: (inv) => formatCurrency(inv.driverPayMinor),
    },
    {
      key: 'status',
      header: 'Status',
      width: '10%',
      render: (inv) => <Badge tone={statusTone(inv.status)}>{humanizeStatus(inv.status)}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      width: '9%',
      align: 'right',
      render: (inv) => (
        <div className="flex items-center justify-end gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); handleOpenModal(inv); }}
            title="Edit invoice"
            className="p-1.5 rounded-ctl text-fg-3 hover:text-accent hover:bg-surface-2 transition-colors"
          >
            <Edit2 size={15} />
          </button>
          {(inv.status === 'ISSUED' || inv.status === 'OVERDUE') && (
            <button
              onClick={(e) => { e.stopPropagation(); handleMarkPaid(inv); }}
              title="Mark paid"
              className="p-1.5 rounded-ctl text-pos hover:bg-surface-2 transition-colors"
            >
              <CheckCircle2 size={15} />
            </button>
          )}
          {inv.status === 'ISSUED' && (
            <button
              onClick={(e) => { e.stopPropagation(); setVoidItem(inv); }}
              title="Void invoice"
              className="p-1.5 rounded-ctl text-warn hover:bg-surface-2 transition-colors"
            >
              <Ban size={15} />
            </button>
          )}
          {(inv.status === 'DRAFT' || inv.status === 'ISSUED') && (
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteItem(inv); }}
              title="Delete invoice"
              className="p-1.5 rounded-ctl text-fg-3 hover:text-danger hover:bg-surface-2 transition-colors"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  const customerOptions = [
    { value: '', label: 'Select customer' },
    ...customers.map(c => ({ value: c.id, label: c.name })),
  ];

  return (
    <div className="space-y-3.5">
      <PageHeader
        title="Billing, Factoring & Invoices"
        subtitle="RTS Financial recourse factoring, driver settlements, AR aging, & manual invoices."
        actions={
          <Button icon={<Plus size={13} />} onClick={() => handleOpenModal()}>
            Manual invoice
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          variant="hero"
          label="Total accounts receivable"
          value={formatCurrency(kpiData.totalAr)}
          sub="Issued + overdue balance"
        />
        <StatCard
          label="Collected this month"
          value={formatCurrency(kpiData.collectedThisMonth)}
          sub="Paid invoices"
        />
        <StatCard
          variant="ring"
          ringPct={kpiData.collectedPct}
          label="Collection rate"
          value={`${kpiData.collectedPct}%`}
          sub="Paid vs. total billed"
        />
        <StatCard
          label="Overdue invoices"
          value={String(kpiData.overdueCount)}
          sub={kpiData.overdueCount > 0 ? <span className="text-danger font-semibold">Needs follow-up</span> : 'All current'}
        />
      </div>

      <DataTable
        columns={columns}
        rows={paginatedInvoices}
        rowKey={(inv) => inv.id}
        empty={
          <EmptyState
            icon={<FileText size={30} strokeWidth={1.5} />}
            title="No invoices found"
            sub="Try a different status or search term."
            action={
              <Button icon={<Plus size={13} />} onClick={() => handleOpenModal()}>
                Add manual invoice
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
                placeholder="Search invoice #, customer…"
              />
            }
            meta={`Showing ${paginatedInvoices.length} of ${filteredInvoices.length}`}
            chips={
              <FilterChips
                label="Filter invoices by status"
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

      {deliveredLoadsReady.length > 0 && (
        <Card
          header={
            <h2 className="text-[13.5px] font-semibold text-fg flex items-center gap-2">
              <FileText size={16} className="text-pos" />
              <span>Delivered loads ready for invoicing</span>
            </h2>
          }
        >
          <div className="space-y-2.5">
            {deliveredLoadsReady.map(l => (
              <div key={l.id} className="p-3 rounded-ctl bg-surface-2 border border-bd flex items-center justify-between">
                <div>
                  <span className="font-semibold text-accent tnum text-[13px] mr-3">Load {l.loadNumber}</span>
                  <span className="text-fg-2 text-[13px]">Total: {formatCurrency(l.rateMinor)}</span>
                </div>
                <Button size="sm" icon={<FileText size={13} />} onClick={() => handleGenerateInvoice(l.id)}>
                  Generate invoice
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editItem ? 'Edit invoice' : 'Add manual invoice'}
        busy={isLoading}
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModal} disabled={isLoading}>Cancel</Button>
            <Button type="submit" form="invoice-form" loading={isLoading}>
              {isLoading ? 'Saving…' : 'Save invoice'}
            </Button>
          </>
        }
      >
        <form id="invoice-form" onSubmit={handleSave} className="space-y-4">
          <Input
            label="Invoice number"
            required
            className="tnum"
            value={formData.invoiceNumber || ''}
            onChange={e => setFormData({ ...formData, invoiceNumber: e.target.value })}
          />
          <Select
            label="Customer"
            required
            options={customerOptions}
            value={formData.customerId || ''}
            onChange={e => setFormData({ ...formData, customerId: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Issue date"
              required
              type="date"
              className="tnum"
              value={formData.issueDate || ''}
              onChange={e => setFormData({ ...formData, issueDate: e.target.value })}
            />
            <Input
              label="Due date"
              required
              type="date"
              className="tnum"
              value={formData.dueDate || ''}
              onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>
          <Input
            label="Subtotal ($)"
            required
            type="number"
            step="0.01"
            className="tnum"
            value={formData.subtotalMinor !== undefined ? formData.subtotalMinor / 100 : ''}
            onChange={handleSubtotalChange}
          />
          <Select
            label="Status"
            options={FORM_STATUS_OPTIONS}
            value={formData.status || 'DRAFT'}
            onChange={e => setFormData({ ...formData, status: e.target.value as any })}
          />
        </form>
      </Modal>

      {voidItem && (
        <ConfirmModal
          isOpen={!!voidItem}
          title="Void Invoice"
          message={`Are you sure you want to void invoice ${voidItem.invoiceNumber}? This action cannot be undone.`}
          isDanger={true}
          onConfirm={handleVoid}
          onCancel={() => setVoidItem(null)}
          isLoading={isLoading}
        />
      )}

      {deleteItem && (
        <ConfirmModal
          isOpen={!!deleteItem}
          title="Delete Invoice"
          message={`Are you sure you want to delete invoice ${deleteItem.invoiceNumber}?`}
          isDanger={true}
          onConfirm={handleDelete}
          onCancel={() => setDeleteItem(null)}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};
