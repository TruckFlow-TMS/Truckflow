import React, { useState, useMemo } from 'react';
import { Driver, Load, DriverPayrollRecord, PayrollAddition, PayrollDeduction } from '../../types/tms';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/Toast';
import { mockStore } from '../../services/mockStore';
import {
  Card, Button, Input, Badge, Avatar, PageHeader, EmptyState
} from '../ui';
import {
  Wallet, Calendar, UserCheck, DollarSign, Printer, Download,
  CheckCircle2, Plus, Trash2, FileText, CheckSquare, Square,
  Truck, ArrowRight, ShieldCheck, Filter, ChevronRight
} from 'lucide-react';

interface PayrollViewProps {
  drivers: Driver[];
  loads: Load[];
  onReload: () => void;
}

export const PayrollView: React.FC<PayrollViewProps> = ({ drivers, loads, onReload }) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  // 1. Selected Driver State
  const [selectedDriverId, setSelectedDriverId] = useState<string>(drivers[0]?.id || '');

  // 2. Timeframe & Filter State
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [endDate, setEndDate] = useState<string>('2026-12-31');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNSETTLED' | 'SETTLED'>('UNSETTLED');

  // Selected Loads for Payroll
  const [selectedLoadIds, setSelectedLoadIds] = useState<string[]>([]);

  // Additions & Deductions
  const [additions, setAdditions] = useState<PayrollAddition[]>([]);
  const [deductions, setDeductions] = useState<PayrollDeduction[]>([]);
  const [newAddDesc, setNewAddDesc] = useState('');
  const [newAddAmount, setNewAddAmount] = useState('');
  const [newDedDesc, setNewDedDesc] = useState('');
  const [newDedAmount, setNewDedAmount] = useState('');

  // Paycheck PDF / Print Statement Modal
  const [showPaystubModal, setShowPaystubModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Active Selected Driver Object
  const selectedDriver = useMemo(() => {
    return drivers.find(d => d.id === selectedDriverId) || drivers[0];
  }, [drivers, selectedDriverId]);

  // Driver's Loads in Date Range
  const driverLoads = useMemo(() => {
    if (!selectedDriver) return [];
    return loads.filter(l => {
      if (l.driverId !== selectedDriver.id && l.driverName !== selectedDriver.name) return false;

      // Filter by Date Range
      if (startDate && l.deliveryDate && l.deliveryDate < startDate) return false;
      if (endDate && l.deliveryDate && l.deliveryDate > endDate) return false;

      // Filter by Settlement Status
      const isSettled = l.documents?.some(d => d.type === 'RECEIPT') || l.status === 'PAID';
      if (statusFilter === 'UNSETTLED' && isSettled) return false;
      if (statusFilter === 'SETTLED' && !isSettled) return false;

      return true;
    });
  }, [loads, selectedDriver, startDate, endDate, statusFilter]);

  // Auto Select All Unsettled Loads when driver changes
  React.useEffect(() => {
    const defaultIds = driverLoads.map(l => l.id);
    setSelectedLoadIds(defaultIds);
  }, [selectedDriverId, startDate, endDate, statusFilter]);

  // Selected Loads Objects
  const activeSelectedLoads = useMemo(() => {
    return driverLoads.filter(l => selectedLoadIds.includes(l.id));
  }, [driverLoads, selectedLoadIds]);

  // 3. Calculation Engine
  const calculationSummary = useMemo(() => {
    if (!selectedDriver) {
      return { totalMiles: 0, grossRateMinor: 0, basePayMinor: 0, additionsMinor: 0, deductionsMinor: 0, netPayMinor: 0 };
    }

    let totalMiles = 0;
    let grossRateMinor = 0;
    let basePayMinor = 0;

    activeSelectedLoads.forEach(l => {
      totalMiles += (l.loadedMiles || 0);
      grossRateMinor += l.rateMinor;

      // Auto Calculation based on Driver Pay Rate Type
      if (selectedDriver.payRateType === 'PER_MILE') {
        // payRateMinor is in cents per mile or dollar float value
        const ratePerMile = selectedDriver.payRateMinor > 10 ? selectedDriver.payRateMinor / 100 : selectedDriver.payRateMinor;
        basePayMinor += Math.round((l.loadedMiles || 0) * ratePerMile * 100);
      } else if (selectedDriver.payRateType === 'FLAT_PERCENT') {
        // payRateMinor is percentage (e.g. 25 = 25%)
        const pct = selectedDriver.payRateMinor > 100 ? selectedDriver.payRateMinor / 100 : selectedDriver.payRateMinor;
        basePayMinor += Math.round(l.rateMinor * (pct / 100));
      } else if (selectedDriver.payRateType === 'PER_HOUR') {
        // Estimate 8 hours per load if hourly
        const hourlyRate = selectedDriver.payRateMinor > 100 ? selectedDriver.payRateMinor / 100 : selectedDriver.payRateMinor;
        basePayMinor += Math.round(8 * hourlyRate * 100);
      }
    });

    const additionsMinor = additions.reduce((sum, a) => sum + a.amountMinor, 0);
    const deductionsMinor = deductions.reduce((sum, d) => sum + d.amountMinor, 0);
    const netPayMinor = Math.max(0, basePayMinor + additionsMinor - deductionsMinor);

    return {
      totalMiles,
      grossRateMinor,
      basePayMinor,
      additionsMinor,
      deductionsMinor,
      netPayMinor,
    };
  }, [selectedDriver, activeSelectedLoads, additions, deductions]);

  // Handlers for Additions / Deductions
  const handleAddAddition = () => {
    if (!newAddDesc || !newAddAmount) return;
    const amountFloat = parseFloat(newAddAmount);
    if (isNaN(amountFloat) || amountFloat <= 0) return;

    setAdditions(prev => [
      ...prev,
      { id: `add-${Date.now()}`, description: newAddDesc, amountMinor: Math.round(amountFloat * 100) }
    ]);
    setNewAddDesc('');
    setNewAddAmount('');
  };

  const handleRemoveAddition = (id: string) => {
    setAdditions(prev => prev.filter(a => a.id !== id));
  };

  const handleAddDeduction = () => {
    if (!newDedDesc || !newDedAmount) return;
    const amountFloat = parseFloat(newDedAmount);
    if (isNaN(amountFloat) || amountFloat <= 0) return;

    setDeductions(prev => [
      ...prev,
      { id: `ded-${Date.now()}`, description: newDedDesc, amountMinor: Math.round(amountFloat * 100) }
    ]);
    setNewDedDesc('');
    setNewDedAmount('');
  };

  const handleRemoveDeduction = (id: string) => {
    setDeductions(prev => prev.filter(d => d.id !== id));
  };

  const toggleSelectLoad = (id: string) => {
    setSelectedLoadIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllLoads = () => {
    if (selectedLoadIds.length === driverLoads.length) {
      setSelectedLoadIds([]);
    } else {
      setSelectedLoadIds(driverLoads.map(l => l.id));
    }
  };

  // Quick Preset Date Helpers
  const setQuickDatePreset = (preset: 'THIS_WEEK' | 'LAST_14_DAYS' | 'THIS_MONTH' | 'ALL_TIME') => {
    const today = new Date();
    if (preset === 'THIS_WEEK') {
      const first = today.getDate() - today.getDay();
      const firstDay = new Date(today.setDate(first)).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(new Date().toISOString().split('T')[0]);
    } else if (preset === 'LAST_14_DAYS') {
      const prior = new Date();
      prior.setDate(today.getDate() - 14);
      setStartDate(prior.toISOString().split('T')[0]);
      setEndDate(new Date().toISOString().split('T')[0]);
    } else if (preset === 'THIS_MONTH') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(new Date().toISOString().split('T')[0]);
    } else {
      setStartDate('2026-01-01');
      setEndDate('2026-12-31');
    }
  };

  // Process Driver Settlement & Mark Loads Paid
  const handleProcessSettlement = async () => {
    if (!currentUser || activeSelectedLoads.length === 0) return;
    setIsProcessing(true);
    try {
      for (const ld of activeSelectedLoads) {
        await mockStore.updateLoadStatus(ld.id, 'PAID', currentUser);
      }
      showToast('success', `Successfully processed payroll statement for ${selectedDriver.name}!`);
      setIsProcessing(false);
      setShowPaystubModal(true);
      onReload();
    } catch (err: any) {
      setIsProcessing(false);
      showToast('error', err.message || 'Failed to process payroll');
    }
  };

  // Print PDF Paystub
  const handlePrintPaystub = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Driver Payroll & Settlement Engine"
        subtitle="Select a driver, filter load timeframes, calculate automatic earnings & generate PDF paycheck statements"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={<Printer size={14} />}
              disabled={activeSelectedLoads.length === 0}
              onClick={() => setShowPaystubModal(true)}
            >
              Preview PDF Paystub
            </Button>

            <Button
              icon={<CheckCircle2 size={14} />}
              disabled={activeSelectedLoads.length === 0}
              loading={isProcessing}
              onClick={handleProcessSettlement}
            >
              Process Paycheck (${(calculationSummary.netPayMinor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })})
            </Button>
          </div>
        }
      />

      {/* Top 3 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Step 1: Select Driver & View Pay Profile */}
        <Card
          header={
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center text-[11px] font-bold">1</span>
              <h2 className="text-[13.5px] font-bold text-fg">Select Driver &amp; Rate Profile</h2>
            </div>
          }
        >
          <div className="space-y-3.5 text-[12.5px]">
            <div>
              <label className="block text-[11px] font-semibold text-fg-2 uppercase tracking-wide mb-1">
                Choose Driver *
              </label>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full bg-surface border border-bd rounded-ctl px-3 py-2 text-[13px] font-semibold text-fg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.employmentType === 'OWNER_OPERATOR' ? 'Owner Operator' : 'Company Driver'})
                  </option>
                ))}
              </select>
            </div>

            {selectedDriver && (
              <div className="p-3 rounded-ctl bg-surface-2 border border-bd space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar name={selectedDriver.name} size={28} />
                    <div>
                      <h4 className="font-bold text-fg text-[13px]">{selectedDriver.name}</h4>
                      <p className="text-[11px] text-fg-3">{selectedDriver.email}</p>
                    </div>
                  </div>
                  <Badge tone={selectedDriver.status === 'AVAILABLE' ? 'pos' : 'neutral'}>
                    {selectedDriver.status}
                  </Badge>
                </div>

                <div className="pt-2 border-t border-bd grid grid-cols-2 gap-2 text-[11.5px]">
                  <div>
                    <span className="text-fg-3 block">Pay Rate Structure:</span>
                    <span className="font-bold text-accent">
                      {selectedDriver.payRateType === 'PER_MILE' && `$${(selectedDriver.payRateMinor > 10 ? selectedDriver.payRateMinor / 100 : selectedDriver.payRateMinor).toFixed(2)} / Mile`}
                      {selectedDriver.payRateType === 'FLAT_PERCENT' && `${selectedDriver.payRateMinor > 100 ? selectedDriver.payRateMinor / 100 : selectedDriver.payRateMinor}% of Gross`}
                      {selectedDriver.payRateType === 'PER_HOUR' && `$${(selectedDriver.payRateMinor > 100 ? selectedDriver.payRateMinor / 100 : selectedDriver.payRateMinor).toFixed(2)} / Hour`}
                    </span>
                  </div>
                  <div>
                    <span className="text-fg-3 block">Assigned Truck:</span>
                    <span className="font-semibold text-fg">
                      {selectedDriver.assignedTruckNumber ? `Truck #${selectedDriver.assignedTruckNumber}` : 'Unassigned'}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-fg-3 pt-1 border-t border-bd flex justify-between tnum">
                  <span>CDL #: {selectedDriver.cdlNumber}</span>
                  <span>CDL Exp: {selectedDriver.cdlExpiration}</span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Step 2: Timeframe & Date Filters */}
        <Card
          header={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center text-[11px] font-bold">2</span>
                <h2 className="text-[13.5px] font-bold text-fg">Filter Timeframe &amp; Status</h2>
              </div>
              <Filter size={14} className="text-accent" />
            </div>
          }
        >
          <div className="space-y-3 text-[12.5px]">
            {/* Quick Date Presets */}
            <div>
              <label className="block text-[11px] font-semibold text-fg-2 uppercase tracking-wide mb-1">
                Quick Date Filter
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setQuickDatePreset('THIS_WEEK')}
                  className="px-2 py-1 rounded bg-surface border border-bd text-[11px] font-medium text-fg hover:bg-surface-2 transition"
                >
                  This Week
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDatePreset('LAST_14_DAYS')}
                  className="px-2 py-1 rounded bg-surface border border-bd text-[11px] font-medium text-fg hover:bg-surface-2 transition"
                >
                  Last 14 Days
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDatePreset('THIS_MONTH')}
                  className="px-2 py-1 rounded bg-surface border border-bd text-[11px] font-medium text-fg hover:bg-surface-2 transition"
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDatePreset('ALL_TIME')}
                  className="px-2 py-1 rounded bg-surface border border-bd text-[11px] font-medium text-fg hover:bg-surface-2 transition"
                >
                  All Dates
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                label="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="tnum"
              />
              <Input
                type="date"
                label="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="tnum"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-fg-2 uppercase tracking-wide mb-1">
                Settlement Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full bg-surface border border-bd rounded-ctl px-3 py-1.5 text-[12px] font-medium text-fg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="UNSETTLED">Unsettled Loads Only (Pending Payroll)</option>
                <option value="SETTLED">Settled Loads (Already Payrolled)</option>
                <option value="ALL">All Loads</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Step 3: Real-Time Payroll Summary */}
        <Card
          header={
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center text-[11px] font-bold">3</span>
              <h2 className="text-[13.5px] font-bold text-fg">Payroll Calculation Summary</h2>
            </div>
          }
        >
          <div className="space-y-2.5 text-[12px]">
            <div className="flex justify-between items-center pb-1.5 border-b border-bd">
              <span className="text-fg-2">Selected Loads Count:</span>
              <span className="font-bold text-fg tnum">{activeSelectedLoads.length} of {driverLoads.length} loads</span>
            </div>

            <div className="flex justify-between items-center pb-1.5 border-b border-bd">
              <span className="text-fg-2">Total Loaded Miles:</span>
              <span className="font-bold text-fg tnum">{calculationSummary.totalMiles.toLocaleString()} mi</span>
            </div>

            <div className="flex justify-between items-center pb-1.5 border-b border-bd">
              <span className="text-fg-2">Total Load Gross Revenue:</span>
              <span className="font-bold text-fg tnum">${(calculationSummary.grossRateMinor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="flex justify-between items-center pb-1.5 border-b border-bd">
              <span className="text-fg-2 font-medium">Calculated Base Driver Pay:</span>
              <span className="font-bold text-accent text-[13.5px] tnum">${(calculationSummary.basePayMinor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="flex justify-between items-center pb-1.5 border-b border-bd text-pos">
              <span>Additions / Reimbursements (+):</span>
              <span className="font-bold tnum">+${(calculationSummary.additionsMinor / 100).toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center pb-1.5 border-b border-bd text-danger">
              <span>Deductions / Advances (-):</span>
              <span className="font-bold tnum">-${(calculationSummary.deductionsMinor / 100).toFixed(2)}</span>
            </div>

            <div className="p-2.5 rounded-ctl bg-accent-weak/30 border border-accent/40 flex justify-between items-center mt-2">
              <span className="font-bold text-fg text-[13px]">NET DRIVER PAYCHECK:</span>
              <span className="font-bold text-accent text-[18px] tnum">
                ${(calculationSummary.netPayMinor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Loads Selection Table for Selected Driver */}
      <Card
        header={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet size={16} className="text-accent" />
              <h3 className="font-bold text-fg text-[13.5px]">
                Loads for {selectedDriver.name} ({driverLoads.length} matching)
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleSelectAllLoads}
                className="text-[11.5px] font-semibold text-accent hover:underline flex items-center gap-1"
              >
                {selectedLoadIds.length === driverLoads.length ? <CheckSquare size={13} /> : <Square size={13} />}
                <span>{selectedLoadIds.length === driverLoads.length ? 'Deselect All' : 'Select All'}</span>
              </button>
            </div>
          </div>
        }
      >
        {driverLoads.length === 0 ? (
          <EmptyState
            icon={<Wallet size={24} />}
            title="No loads found for selected driver & timeframe"
            sub="Adjust the date range filters or select another driver to calculate payroll."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px] text-left">
              <thead>
                <tr className="border-b border-bd bg-surface-2 text-fg-2 text-[11px] font-bold uppercase tracking-wider">
                  <th className="p-2.5 w-10 text-center">Pay</th>
                  <th className="p-2.5">Load #</th>
                  <th className="p-2.5">Delivered Date</th>
                  <th className="p-2.5">Route</th>
                  <th className="p-2.5 text-right">Miles</th>
                  <th className="p-2.5 text-right">Gross Rate</th>
                  <th className="p-2.5 text-right">Driver Pay</th>
                  <th className="p-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bd">
                {driverLoads.map((ld) => {
                  const isChecked = selectedLoadIds.includes(ld.id);

                  // Calculate per load driver pay
                  let loadDriverPayMinor = 0;
                  if (selectedDriver.payRateType === 'PER_MILE') {
                    const ratePerMile = selectedDriver.payRateMinor > 10 ? selectedDriver.payRateMinor / 100 : selectedDriver.payRateMinor;
                    loadDriverPayMinor = Math.round((ld.loadedMiles || 0) * ratePerMile * 100);
                  } else if (selectedDriver.payRateType === 'FLAT_PERCENT') {
                    const pct = selectedDriver.payRateMinor > 100 ? selectedDriver.payRateMinor / 100 : selectedDriver.payRateMinor;
                    loadDriverPayMinor = Math.round(ld.rateMinor * (pct / 100));
                  } else {
                    const hourlyRate = selectedDriver.payRateMinor > 100 ? selectedDriver.payRateMinor / 100 : selectedDriver.payRateMinor;
                    loadDriverPayMinor = Math.round(8 * hourlyRate * 100);
                  }

                  const isPaid = ld.status === 'PAID';

                  return (
                    <tr
                      key={ld.id}
                      className={`hover:bg-surface-2 transition ${isChecked ? 'bg-accent-weak/10' : ''}`}
                    >
                      <td className="p-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectLoad(ld.id)}
                          className="w-4 h-4 text-accent rounded border-bd focus:ring-accent cursor-pointer"
                        />
                      </td>
                      <td className="p-2.5 font-bold text-accent tnum">{ld.loadNumber}</td>
                      <td className="p-2.5 tnum text-fg-2">{ld.deliveryDate || '2026-02-01'}</td>
                      <td className="p-2.5 text-fg font-medium">
                        {ld.originCity}, {ld.originState} → {ld.destCity}, {ld.destState}
                      </td>
                      <td className="p-2.5 text-right tnum font-semibold">{ld.loadedMiles} mi</td>
                      <td className="p-2.5 text-right tnum font-semibold text-fg">
                        ${(ld.rateMinor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2.5 text-right tnum font-bold text-accent">
                        ${(loadDriverPayMinor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2.5 text-center">
                        <Badge tone={isPaid ? 'pos' : 'warn'}>
                          {isPaid ? '✓ Paid' : 'Pending'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Interactive Additions & Deductions Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Reimbursements & Additions */}
        <Card
          header={
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-fg text-[13px] text-pos inline-flex items-center gap-1.5">
                <Plus size={14} />
                <span>Reimbursements &amp; Additions (+)</span>
              </h3>
              <span className="text-[11.5px] font-bold text-pos tnum">+${(calculationSummary.additionsMinor / 100).toFixed(2)}</span>
            </div>
          }
        >
          <div className="space-y-3 text-[12px]">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Description (e.g. Detention, Layover)"
                value={newAddDesc}
                onChange={(e) => setNewAddDesc(e.target.value)}
                className="h-8 text-[12px]"
              />
              <Input
                type="number"
                placeholder="Amount ($)"
                value={newAddAmount}
                onChange={(e) => setNewAddAmount(e.target.value)}
                className="h-8 w-28 text-[12px] tnum"
              />
              <Button size="sm" onClick={handleAddAddition} icon={<Plus size={12} />}>
                Add
              </Button>
            </div>

            {additions.length === 0 ? (
              <p className="text-[11.5px] text-fg-3 italic py-2">No extra additions added to this paycheck.</p>
            ) : (
              <div className="space-y-1.5">
                {additions.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-2 rounded bg-surface border border-bd">
                    <span className="font-medium text-fg">{a.description}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-pos tnum">+${(a.amountMinor / 100).toFixed(2)}</span>
                      <button onClick={() => handleRemoveAddition(a.id)} className="text-fg-3 hover:text-danger">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Deductions & Cash Advances */}
        <Card
          header={
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-fg text-[13px] text-danger inline-flex items-center gap-1.5">
                <Trash2 size={14} />
                <span>Deductions &amp; Cash Advances (-)</span>
              </h3>
              <span className="text-[11.5px] font-bold text-danger tnum">-${(calculationSummary.deductionsMinor / 100).toFixed(2)}</span>
            </div>
          }
        >
          <div className="space-y-3 text-[12px]">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Description (e.g. Fuel Advance, Escrow)"
                value={newDedDesc}
                onChange={(e) => setNewDedDesc(e.target.value)}
                className="h-8 text-[12px]"
              />
              <Input
                type="number"
                placeholder="Amount ($)"
                value={newDedAmount}
                onChange={(e) => setNewDedAmount(e.target.value)}
                className="h-8 w-28 text-[12px] tnum"
              />
              <Button size="sm" variant="secondary" onClick={handleAddDeduction} icon={<Plus size={12} />}>
                Deduct
              </Button>
            </div>

            {deductions.length === 0 ? (
              <p className="text-[11.5px] text-fg-3 italic py-2">No deductions applied to this paycheck.</p>
            ) : (
              <div className="space-y-1.5">
                {deductions.map(d => (
                  <div key={d.id} className="flex items-center justify-between p-2 rounded bg-surface border border-bd">
                    <span className="font-medium text-fg">{d.description}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-danger tnum">-${(d.amountMinor / 100).toFixed(2)}</span>
                      <button onClick={() => handleRemoveDeduction(d.id)} className="text-fg-3 hover:text-danger">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Paystub PDF Preview / Printable Statement Modal */}
      {showPaystubModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface border border-bd rounded-card shadow-lift w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-bd flex items-center justify-between bg-surface-2">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-accent" />
                <h3 className="font-bold text-fg text-[14px]">Official Driver Paystub &amp; Settlement Report PDF</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" icon={<Printer size={13} />} onClick={handlePrintPaystub}>
                  Print / Download PDF
                </Button>
                <button
                  onClick={() => setShowPaystubModal(false)}
                  className="text-fg-3 hover:text-fg font-bold px-2"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Paystub Body */}
            <div id="printable-paystub" className="p-6 space-y-6 overflow-y-auto bg-white text-slate-900 text-[12px]">
              {/* Paystub Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <h1 className="text-[20px] font-black tracking-tight text-slate-900 uppercase">NUNE HQ LLC</h1>
                  <p className="text-[11px] font-semibold text-orange-600 tracking-wider">YOUR TRUCKING BUSINESS. ONE HEADQUARTERS.</p>
                  <p className="text-[11px] text-slate-600 mt-1">1420 W. Division St, Chicago, IL 60642</p>
                  <p className="text-[11px] text-slate-600">Phone: (800) 555-0199 • Accounting@nunehq.com</p>
                </div>

                <div className="text-right">
                  <div className="inline-block bg-slate-900 text-white font-bold px-3 py-1 text-[13px] rounded mb-1">
                    DRIVER PAYSTUB
                  </div>
                  <p className="font-mono font-bold text-slate-800 text-[12px]">Statement #: PAY-{Date.now().toString().slice(-6)}</p>
                  <p className="text-[11px] text-slate-600">Pay Date: {new Date().toISOString().split('T')[0]}</p>
                  <p className="text-[11px] text-slate-600">Period: {startDate} to {endDate}</p>
                </div>
              </div>

              {/* Driver & Vehicle Summary Bar */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-100 rounded border border-slate-300 text-[11.5px]">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500">Driver Information</p>
                  <p className="font-bold text-slate-900 text-[13px]">{selectedDriver.name}</p>
                  <p className="text-slate-700">Type: {selectedDriver.employmentType === 'OWNER_OPERATOR' ? 'Owner Operator' : 'Company Driver'}</p>
                </div>

                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500">Pay Rate &amp; Vehicle Info</p>
                  <p className="font-bold text-slate-900">
                    Pay Structure: {selectedDriver.payRateType === 'PER_MILE' && `$${(selectedDriver.payRateMinor > 10 ? selectedDriver.payRateMinor / 100 : selectedDriver.payRateMinor).toFixed(2)} / Mile`}
                    {selectedDriver.payRateType === 'FLAT_PERCENT' && `${selectedDriver.payRateMinor > 100 ? selectedDriver.payRateMinor / 100 : selectedDriver.payRateMinor}% of Gross`}
                    {selectedDriver.payRateType === 'PER_HOUR' && `$${(selectedDriver.payRateMinor > 100 ? selectedDriver.payRateMinor / 100 : selectedDriver.payRateMinor).toFixed(2)} / Hour`}
                  </p>
                  <p className="text-slate-700">Assigned Equipment: {selectedDriver.assignedTruckNumber ? `Truck #${selectedDriver.assignedTruckNumber}` : 'Fleet Unit'}</p>
                </div>
              </div>

              {/* Itemized Loads Table */}
              <div>
                <h4 className="font-bold text-slate-900 text-[12.5px] uppercase tracking-wide mb-2">Itemized Trips / Loads ({activeSelectedLoads.length})</h4>
                <table className="w-full text-left text-[11px] border border-slate-300">
                  <thead className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2 border-r border-slate-700">Load #</th>
                      <th className="p-2 border-r border-slate-700">Date</th>
                      <th className="p-2 border-r border-slate-700">Route</th>
                      <th className="p-2 text-right border-r border-slate-700">Miles</th>
                      <th className="p-2 text-right border-r border-slate-700">Gross Load Rate</th>
                      <th className="p-2 text-right">Calculated Pay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800 font-mono">
                    {activeSelectedLoads.map((ld) => {
                      let loadPayMinor = 0;
                      if (selectedDriver.payRateType === 'PER_MILE') {
                        const ratePerMile = selectedDriver.payRateMinor > 10 ? selectedDriver.payRateMinor / 100 : selectedDriver.payRateMinor;
                        loadPayMinor = Math.round((ld.loadedMiles || 0) * ratePerMile * 100);
                      } else if (selectedDriver.payRateType === 'FLAT_PERCENT') {
                        const pct = selectedDriver.payRateMinor > 100 ? selectedDriver.payRateMinor / 100 : selectedDriver.payRateMinor;
                        loadPayMinor = Math.round(ld.rateMinor * (pct / 100));
                      } else {
                        const hourlyRate = selectedDriver.payRateMinor > 100 ? selectedDriver.payRateMinor / 100 : selectedDriver.payRateMinor;
                        loadPayMinor = Math.round(8 * hourlyRate * 100);
                      }

                      return (
                        <tr key={ld.id}>
                          <td className="p-2 font-bold border-r border-slate-200">{ld.loadNumber}</td>
                          <td className="p-2 border-r border-slate-200">{ld.deliveryDate || '2026-02-01'}</td>
                          <td className="p-2 border-r border-slate-200 font-sans">{ld.originCity}, {ld.originState} → {ld.destCity}, {ld.destState}</td>
                          <td className="p-2 text-right border-r border-slate-200 font-semibold">{ld.loadedMiles} mi</td>
                          <td className="p-2 text-right border-r border-slate-200">${(ld.rateMinor / 100).toFixed(2)}</td>
                          <td className="p-2 text-right font-bold text-slate-900">${(loadPayMinor / 100).toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-900 text-slate-900">
                    <tr>
                      <td colSpan={3} className="p-2 uppercase text-right">Subtotal Trips ({calculationSummary.totalMiles} mi):</td>
                      <td className="p-2 text-right font-mono">{calculationSummary.totalMiles} mi</td>
                      <td className="p-2 text-right font-mono">${(calculationSummary.grossRateMinor / 100).toFixed(2)}</td>
                      <td className="p-2 text-right font-mono text-slate-900 text-[12px]">${(calculationSummary.basePayMinor / 100).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Accessorials & Deductions Summary Grid */}
              <div className="grid grid-cols-2 gap-4 text-[11px]">
                <div className="border border-slate-300 rounded p-2.5 space-y-1">
                  <p className="font-bold uppercase text-slate-900 text-[10px] pb-1 border-b border-slate-200">Reimbursements &amp; Additions (+)</p>
                  {additions.length === 0 ? (
                    <p className="text-slate-500 italic">None</p>
                  ) : (
                    additions.map(a => (
                      <div key={a.id} className="flex justify-between font-mono text-emerald-700">
                        <span>{a.description}:</span>
                        <span>+${(a.amountMinor / 100).toFixed(2)}</span>
                      </div>
                    ))
                  )}
                  <div className="pt-1 border-t border-slate-200 flex justify-between font-bold text-emerald-800">
                    <span>Total Additions:</span>
                    <span>+${(calculationSummary.additionsMinor / 100).toFixed(2)}</span>
                  </div>
                </div>

                <div className="border border-slate-300 rounded p-2.5 space-y-1">
                  <p className="font-bold uppercase text-slate-900 text-[10px] pb-1 border-b border-slate-200">Deductions &amp; Advances (-)</p>
                  {deductions.length === 0 ? (
                    <p className="text-slate-500 italic">None</p>
                  ) : (
                    deductions.map(d => (
                      <div key={d.id} className="flex justify-between font-mono text-red-700">
                        <span>{d.description}:</span>
                        <span>-${(d.amountMinor / 100).toFixed(2)}</span>
                      </div>
                    ))
                  )}
                  <div className="pt-1 border-t border-slate-200 flex justify-between font-bold text-red-800">
                    <span>Total Deductions:</span>
                    <span>-${(calculationSummary.deductionsMinor / 100).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Net Pay Box */}
              <div className="p-4 bg-slate-900 text-white rounded flex justify-between items-center">
                <div>
                  <p className="text-[10px] uppercase font-bold text-orange-400">NET DRIVER PAYOUT</p>
                  <p className="text-[11px] text-slate-300">Direct Deposit / Check Amount</p>
                </div>
                <p className="text-[24px] font-black font-mono tracking-tight text-white">
                  ${(calculationSummary.netPayMinor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Signature Blocks */}
              <div className="grid grid-cols-2 gap-8 pt-6 text-[11px] text-slate-600">
                <div className="border-t border-slate-400 pt-1">
                  <p className="font-bold text-slate-800">Authorized Payroll Approval</p>
                  <p>Nune HQ Payroll Officer Signature</p>
                </div>
                <div className="border-t border-slate-400 pt-1">
                  <p className="font-bold text-slate-800">Driver Acknowledgment</p>
                  <p>{selectedDriver.name} Signature &amp; Date</p>
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-bd bg-surface-2 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowPaystubModal(false)}>
                Close Preview
              </Button>
              <Button icon={<Printer size={13} />} onClick={handlePrintPaystub}>
                Print Paystub PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
