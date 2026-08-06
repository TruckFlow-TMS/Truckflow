import React, { useState, useRef, useEffect } from 'react';
import { Customer, Driver, Equipment, LoadStop } from '../../types/tms';
import { mockStore } from '../../services/mockStore';
import { useAuth } from '../../context/AuthContext';
import {
  DollarSign, MapPin, Truck, Plus, Package, FileText, Trash2, CalendarDays,
  Search, X, UserPlus, ChevronDown,
} from 'lucide-react';
import { Modal, Card, Input, Select, Textarea, Button } from '../ui';

/* ── US state abbreviations for dropdowns ─────────────────────────────────── */
const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
];

const QUANTITY_UNITS = [
  { value: 'pallets', label: 'Pallets' },
  { value: 'pieces', label: 'Pieces' },
  { value: 'cases', label: 'Cases' },
  { value: 'rolls', label: 'Rolls' },
  { value: 'skids', label: 'Skids' },
  { value: 'crates', label: 'Crates' },
];

const FEE_TYPES = [
  { value: 'flat', label: 'Flat Fee' },
  { value: 'per_mile', label: 'Per Mile' },
  { value: 'percentage', label: 'Percentage' },
];

const DEFAULT_EQUIPMENT_TYPES = [
  'Dry Van', 'Reefer', 'Flatbed', 'Step Deck', 'Power Only',
  'Box Truck', 'Hotshot', 'Conestoga', 'Lowboy', 'RGN',
  'Double Drop', 'Tanker', 'Intermodal', 'Car Hauler',
];

const CUSTOMER_TYPES = [
  { value: '', label: 'Select type…' },
  { value: 'broker', label: 'Broker' },
  { value: 'shipper', label: 'Shipper' },
  { value: 'consignee', label: 'Consignee' },
  { value: 'factoring', label: 'Factoring Company' },
  { value: 'carrier', label: 'Carrier' },
];

/* ── Section header ───────────────────────────────────────────────────────── */
const SectionHeader: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
  <div className="flex items-center gap-2 text-fg-2 font-semibold uppercase tracking-wide text-[11px] pb-1">
    {icon}
    <span>{title}</span>
  </div>
);

/* ── Required label helper ────────────────────────────────────────────────── */
const req = (label: string) => `${label} *`;

interface CreateLoadModalProps {
  isOpen: boolean;
  customers: Customer[];
  drivers: Driver[];
  equipment: Equipment[];
  onClose: () => void;
  onReload: () => void;
}

export const CreateLoadModal: React.FC<CreateLoadModalProps> = ({
  isOpen, customers, drivers, equipment, onClose, onReload
}) => {
  const { currentUser } = useAuth();

  /* ── Basic details ──────────────────────────────────────────────────────── */
  const [customLoadNumber, setCustomLoadNumber] = useState('');
  const [brokerId, setBrokerId] = useState('');
  const [brokerReference, setBrokerReference] = useState('');
  const [equipmentType, setEquipmentType] = useState('');

  /* ── Equipment type autocomplete ─────────────────────────────────────────── */
  const [eqSearch, setEqSearch] = useState('');
  const [eqDropOpen, setEqDropOpen] = useState(false);
  const [customEqTypes, setCustomEqTypes] = useState<string[]>([]);
  const eqWrapRef = useRef<HTMLDivElement>(null);

  const allEqTypes = [...DEFAULT_EQUIPMENT_TYPES, ...customEqTypes];
  const filteredEqTypes = eqSearch.trim()
    ? allEqTypes.filter(t => t.toLowerCase().includes(eqSearch.toLowerCase()))
    : allEqTypes;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!eqWrapRef.current?.contains(e.target as Node)) setEqDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectEqType = (t: string) => {
    setEquipmentType(t);
    setEqSearch(t);
    setEqDropOpen(false);
  };

  const addCustomEqType = () => {
    const name = eqSearch.trim();
    if (!name) return;
    if (!allEqTypes.some(t => t.toLowerCase() === name.toLowerCase())) {
      setCustomEqTypes(prev => [...prev, name]);
    }
    selectEqType(name);
  };

  const clearEqType = () => {
    setEquipmentType('');
    setEqSearch('');
  };

  /* ── Customer search autocomplete ───────────────────────────────────────── */
  const [custSearch, setCustSearch] = useState('');
  const [custDropOpen, setCustDropOpen] = useState(false);
  const custWrapRef = useRef<HTMLDivElement>(null);
  const custInputRef = useRef<HTMLInputElement>(null);

  const filteredCustomers = custSearch.trim()
    ? customers.filter(c =>
        c.name.toLowerCase().includes(custSearch.toLowerCase()) ||
        (c.mcNumber && c.mcNumber.includes(custSearch)) ||
        (c.city && c.city.toLowerCase().includes(custSearch.toLowerCase())) ||
        (c.state && c.state.toLowerCase().includes(custSearch.toLowerCase()))
      )
    : customers;

  const selectedCustomer = customers.find(c => c.id === brokerId);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!custWrapRef.current?.contains(e.target as Node)) setCustDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectCustomer = (c: Customer) => {
    setBrokerId(c.id);
    setCustSearch(c.name);
    setCustDropOpen(false);
  };

  const clearCustomer = () => {
    setBrokerId('');
    setCustSearch('');
    custInputRef.current?.focus();
  };

  /* ── Create Customer inline form ────────────────────────────────────────── */
  const [showCreateCust, setShowCreateCust] = useState(false);
  const [newCust, setNewCust] = useState({
    name: '', customerType: '', street: '', aptSuite: '',
    city: '', state: '', zip: '', phone: '', phoneExt: '',
    altPhone: '', fax: '', email: '', website: '', contact: '',
    mcNumber: '', taxId: '', notes: '',
  });
  const [creatingCust, setCreatingCust] = useState(false);

  const updateNewCust = (field: string, value: string) =>
    setNewCust(prev => ({ ...prev, [field]: value }));

  const handleCreateCustomer = async () => {
    if (!currentUser || !newCust.name.trim()) return;
    setCreatingCust(true);
    try {
      const created = await mockStore.createCustomer({
        name: newCust.name,
        mcNumber: newCust.mcNumber || undefined,
        dotNumber: undefined,
        contactPerson: newCust.contact || undefined,
        contactEmail: newCust.email || undefined,
        contactPhone: newCust.phone || undefined,
        billingAddress: [newCust.street, newCust.aptSuite].filter(Boolean).join(', ') || undefined,
        city: newCust.city || undefined,
        state: newCust.state || undefined,
        zip: newCust.zip || undefined,
        paymentOption: 'CHECK',
        creditLimitMinor: 10000000,
        isActive: true,
        notes: newCust.notes || undefined,
      }, currentUser);

      // Select the newly created customer
      setBrokerId(created.id);
      setCustSearch(created.name);
      setShowCreateCust(false);
      setNewCust({
        name: '', customerType: '', street: '', aptSuite: '',
        city: '', state: '', zip: '', phone: '', phoneExt: '',
        altPhone: '', fax: '', email: '', website: '', contact: '',
        mcNumber: '', taxId: '', notes: '',
      });
      onReload();
    } catch (err) {
      console.error('Failed to create customer:', err);
    } finally {
      setCreatingCust(false);
    }
  };

  /* ── Stops ──────────────────────────────────────────────────────────────── */
  interface StopData {
    facilityName: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    date: string;
    instructions: string;
    bol: string;
  }

  const emptyStop = (type: 'pickup' | 'delivery'): StopData => ({
    facilityName: '', address: '', city: '', state: '', zip: '', date: '', instructions: '', bol: '',
  });

  const [pickups, setPickups] = useState<StopData[]>([emptyStop('pickup')]);
  const [deliveries, setDeliveries] = useState<StopData[]>([emptyStop('delivery')]);

  const updateStop = (
    list: StopData[],
    setter: React.Dispatch<React.SetStateAction<StopData[]>>,
    index: number,
    field: keyof StopData,
    value: string,
  ) => {
    const copy = [...list];
    copy[index] = { ...copy[index], [field]: value };
    setter(copy);
  };

  /* ── Load details ───────────────────────────────────────────────────────── */
  const [weight, setWeight] = useState('');
  const [quantity, setQuantity] = useState('');
  const [quantityUnit, setQuantityUnit] = useState('pallets');
  const [commodity, setCommodity] = useState('');
  const [customerRequiredInfo, setCustomerRequiredInfo] = useState('');
  const [notes, setNotes] = useState('');

  /* ── Fees & charges ─────────────────────────────────────────────────────── */
  const [rate, setRate] = useState(0);
  const [feeType, setFeeType] = useState('flat');
  const [fscAmount, setFscAmount] = useState(0);
  const [fscType, setFscType] = useState('flat');
  const [detention, setDetention] = useState(0);
  const [lumper, setLumper] = useState(0);
  const [stopOff, setStopOff] = useState(0);
  const [tarpFee, setTarpFee] = useState(0);

  /* ── Assignment ─────────────────────────────────────────────────────────── */
  const [driverId, setDriverId] = useState('');
  const [truckId, setTruckId] = useState('');
  const [trailerId, setTrailerId] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ── Submit ─────────────────────────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSubmitting(true);

    try {
      const selectedCustomer = customers.find(c => c.id === brokerId);
      const p = pickups[0];
      const d = deliveries[0];

      const stops: Partial<LoadStop>[] = [
        ...pickups.map((s, i) => ({
          sequence: i + 1,
          type: 'PICKUP' as const,
          facilityName: s.facilityName,
          city: s.city,
          state: s.state,
          zip: s.zip,
          address: s.address,
          appointmentWindowStart: s.date,
          appointmentWindowEnd: '',
        })),
        ...deliveries.map((s, i) => ({
          sequence: pickups.length + i + 1,
          type: 'DELIVERY' as const,
          facilityName: s.facilityName,
          city: s.city,
          state: s.state,
          zip: s.zip,
          address: s.address,
          appointmentWindowStart: s.date,
          appointmentWindowEnd: '',
        })),
      ];

      const newLoad = {
        loadNumber: customLoadNumber || undefined,
        brokerId,
        brokerName: selectedCustomer?.name || '',
        brokerReference,
        rateMinor: Math.round(rate * 100),
        fuelSurchargeMinor: Math.round(fscAmount * 100),
        currency: 'USD',
        originCity: p?.city || '',
        originState: p?.state || '',
        destCity: d?.city || '',
        destState: d?.state || '',
        pickupDate: p?.date || '',
        deliveryDate: d?.date || '',
        loadedMiles: 0,
        deadheadMiles: 0,
        notes,
        stops: stops as LoadStop[],
      };

      const created = await mockStore.createLoad(newLoad as any, currentUser);

      if (driverId || truckId || trailerId) {
        await mockStore.assignDriverAndEquipment(created.id, driverId || '', truckId || '', trailerId || '', currentUser);
      }

      onReload();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Stop card renderer ─────────────────────────────────────────────────── */
  const renderStop = (
    label: string,
    list: StopData[],
    setter: React.Dispatch<React.SetStateAction<StopData[]>>,
    index: number,
    type: 'pickup' | 'delivery',
  ) => (
    <div key={`${type}-${index}`} className="rounded-ctl border border-bd bg-surface-2 p-3.5 space-y-3 relative">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-fg-2">
          {label} {list.length > 1 ? `#${index + 1}` : ''}
        </span>
        {list.length > 1 && (
          <button
            type="button"
            onClick={() => setter(list.filter((_, i) => i !== index))}
            className="w-6 h-6 rounded flex items-center justify-center text-danger hover:bg-danger-bg transition-colors"
            title="Remove"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      <Input
        label={req(type === 'pickup' ? 'Shipper' : 'Consignee')}
        required
        placeholder="Facility / company name"
        value={list[index].facilityName}
        onChange={(e) => updateStop(list, setter, index, 'facilityName', e.target.value)}
      />

      <Input
        label="Address"
        placeholder="Street address"
        value={list[index].address}
        onChange={(e) => updateStop(list, setter, index, 'address', e.target.value)}
      />

      <div className="grid grid-cols-3 gap-2">
        <Input
          label="City"
          required
          placeholder="City"
          value={list[index].city}
          onChange={(e) => updateStop(list, setter, index, 'city', e.target.value)}
        />
        <Select
          label="State"
          value={list[index].state}
          onChange={(e) => updateStop(list, setter, index, 'state', e.target.value)}
          options={[
            { value: '', label: 'State…' },
            ...US_STATES.map(s => ({ value: s, label: s })),
          ]}
        />
        <Input
          label="ZIP"
          placeholder="ZIP"
          value={list[index].zip}
          onChange={(e) => updateStop(list, setter, index, 'zip', e.target.value)}
          className="tnum"
        />
      </div>

      <Input
        label={req(`${type === 'pickup' ? 'Pickup' : 'Delivery'} date`)}
        required
        type="date"
        value={list[index].date}
        onChange={(e) => updateStop(list, setter, index, 'date', e.target.value)}
        className="tnum"
      />

      <Textarea
        label="Driver instructions"
        placeholder="Pick up number, Apt. time, etc."
        rows={2}
        value={list[index].instructions}
        onChange={(e) => updateStop(list, setter, index, 'instructions', e.target.value)}
      />

      {type === 'pickup' && (
        <Input
          label="BOL #"
          placeholder="Bill of Lading number"
          value={list[index].bol}
          onChange={(e) => updateStop(list, setter, index, 'bol', e.target.value)}
          className="tnum"
        />
      )}
    </div>
  );

  /* ── Currency input helper ──────────────────────────────────────────────── */
  const CurrencyInput: React.FC<{
    label: string;
    value: number;
    onChange: (v: number) => void;
    required?: boolean;
  }> = ({ label, value, onChange, required }) => (
    <div className="space-y-1">
      <label className="text-[11.5px] font-medium text-fg-2">
        {required ? req(label) : label}
      </label>
      <div className="flex items-center">
        <span className="flex items-center justify-center h-[33px] px-2 bg-surface-2 border border-r-0 border-bd rounded-l-ctl text-[12px] text-fg-3 font-semibold select-none">$</span>
        <input
          type="number"
          min="0"
          step="0.01"
          required={required}
          className="w-full h-[33px] px-2.5 bg-surface border border-bd rounded-r-ctl text-[12.5px] text-fg tnum font-semibold placeholder:text-fg-3 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
          placeholder="0.00"
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Build a load"
      subtitle="Enter load details, stops, fees, and optional driver assignment."
      size="lg"
      busy={isSubmitting}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" form="create-load-form" icon={<Plus size={14} />} loading={isSubmitting}>
            {isSubmitting ? 'Building load…' : 'Confirm & build load'}
          </Button>
        </>
      }
    >
      <form id="create-load-form" onSubmit={handleSubmit} className="space-y-5">

        {/* ═══ SECTION 1: Basic Details ═══ */}
        <div className="space-y-3">
          <SectionHeader icon={<FileText size={14} className="text-accent" />} title="Basic Details" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Custom load number"
              placeholder="Optional — overrides system-generated #"
              value={customLoadNumber}
              onChange={(e) => setCustomLoadNumber(e.target.value)}
              className="tnum"
            />

            {/* ── Customer autocomplete with Create button ── */}
            <div className="space-y-1">
              <label className="text-[11.5px] font-medium text-fg-2">{req('Customer / broker')}</label>
              <div className="flex items-center gap-2">
                <div ref={custWrapRef} className="relative flex-1">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-3 pointer-events-none" />
                  <input
                    ref={custInputRef}
                    type="text"
                    required={!brokerId}
                    placeholder="Search by name, city, or state…"
                    className="w-full h-[33px] pl-8 pr-8 bg-surface border border-bd rounded-ctl text-[12.5px] text-fg placeholder:text-fg-3 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
                    value={brokerId ? (selectedCustomer?.name || custSearch) : custSearch}
                    onChange={(e) => {
                      setCustSearch(e.target.value);
                      setBrokerId('');
                      setCustDropOpen(true);
                    }}
                    onFocus={() => setCustDropOpen(true)}
                  />
                  {brokerId && (
                    <button type="button" onClick={clearCustomer} className="absolute right-2 top-1/2 -translate-y-1/2 text-fg-3 hover:text-fg transition-colors">
                      <X size={13} />
                    </button>
                  )}

                  {/* Suggestions dropdown */}
                  {custDropOpen && !brokerId && (
                    <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-[200px] overflow-y-auto rounded-card bg-surface border border-bd shadow-lift">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.slice(0, 8).map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => selectCustomer(c)}
                            className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-surface-2 transition-colors border-b border-bd last:border-b-0"
                          >
                            <div className="min-w-0">
                              <p className="text-[12px] font-semibold text-fg truncate">{c.name}</p>
                              <p className="text-[10.5px] text-fg-3 truncate">
                                {[c.city, c.state].filter(Boolean).join(', ')}
                                {c.mcNumber ? ` • MC# ${c.mcNumber}` : ''}
                              </p>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-3 text-center">
                          <p className="text-[11.5px] text-fg-3">No customers found</p>
                          <button
                            type="button"
                            onClick={() => { setCustDropOpen(false); setShowCreateCust(true); }}
                            className="mt-1.5 text-[11.5px] text-accent font-semibold hover:underline"
                          >
                            + Create new customer
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreateCust(!showCreateCust)}
                  className={`shrink-0 h-[33px] px-3 rounded-ctl border text-[11.5px] font-semibold flex items-center gap-1.5 transition-colors ${
                    showCreateCust
                      ? 'bg-accent text-on-accent border-accent'
                      : 'bg-surface border-bd text-accent hover:bg-accent-weak'
                  }`}
                >
                  <UserPlus size={13} />
                  <span className="hidden sm:inline">{showCreateCust ? 'Cancel' : 'Create'}</span>
                </button>
              </div>
              {brokerId && selectedCustomer && (
                <p className="text-[10.5px] text-pos font-medium">✓ Selected: {selectedCustomer.name}{selectedCustomer.mcNumber ? ` (MC# ${selectedCustomer.mcNumber})` : ''}</p>
              )}
            </div>
          </div>

          {/* ── Inline Create Customer Form ── */}
          {showCreateCust && (
            <div className="rounded-ctl border border-accent/30 bg-accent-weak/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
                  <UserPlus size={13} /> New Customer Registration
                </span>
                <button type="button" onClick={() => setShowCreateCust(false)} className="text-fg-3 hover:text-fg transition-colors">
                  <X size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label={req('Company name')}
                  required
                  placeholder="Business / company name"
                  value={newCust.name}
                  onChange={(e) => updateNewCust('name', e.target.value)}
                />
                <Select
                  label="Customer type"
                  value={newCust.customerType}
                  onChange={(e) => updateNewCust('customerType', e.target.value)}
                  options={CUSTOMER_TYPES}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label="Street" placeholder="Street address" value={newCust.street} onChange={(e) => updateNewCust('street', e.target.value)} />
                <Input label="Apt / Suite / Other" placeholder="Suite, unit, etc." value={newCust.aptSuite} onChange={(e) => updateNewCust('aptSuite', e.target.value)} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Input label={req('City')} required placeholder="City" value={newCust.city} onChange={(e) => updateNewCust('city', e.target.value)} />
                <Select
                  label={req('State')}
                  value={newCust.state}
                  onChange={(e) => updateNewCust('state', e.target.value)}
                  options={[{ value: '', label: 'State…' }, ...US_STATES.map(s => ({ value: s, label: s }))]}
                />
                <Input label="ZIP" placeholder="ZIP code" value={newCust.zip} onChange={(e) => updateNewCust('zip', e.target.value)} className="tnum" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input label="Phone" placeholder="(XXX) XXX-XXXX" value={newCust.phone} onChange={(e) => updateNewCust('phone', e.target.value)} className="tnum" />
                <Input label="Phone ext." placeholder="XXX" value={newCust.phoneExt} onChange={(e) => updateNewCust('phoneExt', e.target.value)} className="tnum" />
                <Input label="Fax" placeholder="(XXX) XXX-XXXX" value={newCust.fax} onChange={(e) => updateNewCust('fax', e.target.value)} className="tnum" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label="Email" type="email" placeholder="user@domain.com" value={newCust.email} onChange={(e) => updateNewCust('email', e.target.value)} />
                <Input label="Website" placeholder="http://www.example.com" value={newCust.website} onChange={(e) => updateNewCust('website', e.target.value)} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input label="Contact person" placeholder="Primary contact name" value={newCust.contact} onChange={(e) => updateNewCust('contact', e.target.value)} />
                <Input label="Motor Carrier #" placeholder="MC number" value={newCust.mcNumber} onChange={(e) => updateNewCust('mcNumber', e.target.value)} className="tnum" />
                <Input label="Tax ID (EIN#)" placeholder="EIN" value={newCust.taxId} onChange={(e) => updateNewCust('taxId', e.target.value)} className="tnum" />
              </div>

              <Textarea label="Notes" placeholder="Additional notes…" rows={2} value={newCust.notes} onChange={(e) => updateNewCust('notes', e.target.value)} />

              <div className="flex justify-end">
                <Button
                  type="button"
                  icon={<UserPlus size={13} />}
                  onClick={handleCreateCustomer}
                  loading={creatingCust}
                  disabled={!newCust.name.trim()}
                >
                  {creatingCust ? 'Creating…' : 'Create & select customer'}
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Broker reference / PO #"
              placeholder="e.g. REF-88492"
              value={brokerReference}
              onChange={(e) => setBrokerReference(e.target.value)}
              className="tnum"
            />
            {/* ── Equipment type autocomplete ── */}
            <div className="space-y-1">
              <label className="text-[11.5px] font-medium text-fg-2">Equipment type</label>
              <div ref={eqWrapRef} className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search or type custom…"
                  className="w-full h-[33px] pl-8 pr-8 bg-surface border border-bd rounded-ctl text-[12.5px] text-fg placeholder:text-fg-3 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
                  value={equipmentType ? eqSearch || equipmentType : eqSearch}
                  onChange={(e) => {
                    setEqSearch(e.target.value);
                    setEquipmentType('');
                    setEqDropOpen(true);
                  }}
                  onFocus={() => setEqDropOpen(true)}
                />
                {equipmentType && (
                  <button type="button" onClick={clearEqType} className="absolute right-2 top-1/2 -translate-y-1/2 text-fg-3 hover:text-fg transition-colors">
                    <X size={13} />
                  </button>
                )}

                {eqDropOpen && !equipmentType && (
                  <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-[200px] overflow-y-auto rounded-card bg-surface border border-bd shadow-lift">
                    {filteredEqTypes.length > 0 ? (
                      filteredEqTypes.map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => selectEqType(t)}
                          className="w-full px-3 py-2 text-left text-[12px] font-medium text-fg hover:bg-surface-2 transition-colors border-b border-bd last:border-b-0"
                        >
                          {t}
                        </button>
                      ))
                    ) : null}

                    {eqSearch.trim() && !allEqTypes.some(t => t.toLowerCase() === eqSearch.trim().toLowerCase()) && (
                      <button
                        type="button"
                        onClick={addCustomEqType}
                        className="w-full px-3 py-2 text-left text-[12px] font-semibold text-accent hover:bg-surface-2 transition-colors flex items-center gap-1.5 border-t border-bd"
                      >
                        <Plus size={12} /> Add "{eqSearch.trim()}" as custom type
                      </button>
                    )}

                    {filteredEqTypes.length === 0 && !eqSearch.trim() && (
                      <div className="px-3 py-3 text-[11.5px] text-fg-3 text-center">No types available</div>
                    )}
                  </div>
                )}
              </div>
              {equipmentType && (
                <p className="text-[10.5px] text-pos font-medium">✓ {equipmentType}</p>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-bd" />

        {/* ═══ SECTION 2: Stops ═══ */}
        <div className="space-y-3">
          <SectionHeader icon={<MapPin size={14} className="text-accent" />} title="Stops" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pickup column */}
            <div className="space-y-3">
              {pickups.map((_, i) => renderStop('Pickup', pickups, setPickups, i, 'pickup'))}
              <button
                type="button"
                onClick={() => setPickups([...pickups, emptyStop('pickup')])}
                className="flex items-center gap-1.5 text-[11.5px] font-semibold text-accent hover:underline"
              >
                <Plus size={13} /> Add another pickup
              </button>
            </div>

            {/* Delivery column */}
            <div className="space-y-3">
              {deliveries.map((_, i) => renderStop('Delivery', deliveries, setDeliveries, i, 'delivery'))}
              <button
                type="button"
                onClick={() => setDeliveries([...deliveries, emptyStop('delivery')])}
                className="flex items-center gap-1.5 text-[11.5px] font-semibold text-accent hover:underline"
              >
                <Plus size={13} /> Add another delivery
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-bd" />

        {/* ═══ SECTION 3: Load Details ═══ */}
        <div className="space-y-3">
          <SectionHeader icon={<Package size={14} className="text-accent" />} title="Load Details" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Weight (lbs)"
              type="number"
              min="0"
              placeholder="Total weight"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="tnum"
            />
            <div className="space-y-1">
              <label className="text-[11.5px] font-medium text-fg-2">Quantity</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="0"
                  className="w-full h-[33px] px-2.5 bg-surface border border-bd rounded-ctl text-[12.5px] text-fg tnum placeholder:text-fg-3 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
                  placeholder="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
                <Select
                  value={quantityUnit}
                  onChange={(e) => setQuantityUnit(e.target.value)}
                  options={QUANTITY_UNITS}
                />
              </div>
            </div>
            <Input
              label="Commodity"
              placeholder="e.g. Electronics, Dry goods"
              value={commodity}
              onChange={(e) => setCommodity(e.target.value)}
            />
          </div>

          <Input
            label="Customer required info"
            placeholder="Rate con number, customer tracking number, PO #, etc."
            value={customerRequiredInfo}
            onChange={(e) => setCustomerRequiredInfo(e.target.value)}
          />

          <Textarea
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Special instructions, commodity details…"
          />
        </div>

        <div className="border-t border-bd" />

        {/* ═══ SECTION 4: Fees & Charges ═══ */}
        <div className="space-y-3">
          <SectionHeader icon={<DollarSign size={14} className="text-accent" />} title="Fees & Charges" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Primary & FSC */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-fg-3 block">Primary fee</span>
              <CurrencyInput label="Primary fee" value={rate} onChange={setRate} required />
              <Select
                label="Fee type"
                value={feeType}
                onChange={(e) => setFeeType(e.target.value)}
                options={FEE_TYPES}
              />

              <span className="text-[11px] font-bold uppercase tracking-wider text-fg-3 block pt-2">Fuel surcharge</span>
              <CurrencyInput label="FSC amount" value={fscAmount} onChange={setFscAmount} />
              <Select
                label="FSC type"
                value={fscType}
                onChange={(e) => setFscType(e.target.value)}
                options={FEE_TYPES}
              />
            </div>

            {/* Right: Accessory fees */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-fg-3 block">Accessory fees</span>
              <CurrencyInput label="Detention" value={detention} onChange={setDetention} />
              <CurrencyInput label="Lumper" value={lumper} onChange={setLumper} />
              <CurrencyInput label="Stop off" value={stopOff} onChange={setStopOff} />
              <CurrencyInput label="Tarp fee" value={tarpFee} onChange={setTarpFee} />
            </div>
          </div>
        </div>

        <div className="border-t border-bd" />

        {/* ═══ SECTION 5: Assignment (optional) ═══ */}
        <div className="space-y-3">
          <SectionHeader icon={<Truck size={14} className="text-accent" />} title="Dispatch Assignment (optional)" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Driver"
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              options={[
                { value: '', label: 'Unassigned' },
                ...drivers.map(d => ({ value: d.id, label: `${d.name} (${d.status})` })),
              ]}
            />
            <Select
              label="Truck"
              value={truckId}
              onChange={(e) => setTruckId(e.target.value)}
              options={[
                { value: '', label: 'Unassigned' },
                ...equipment.filter(eq => eq.type === 'TRUCK').map(eq => ({ value: eq.id, label: eq.unitNumber })),
              ]}
            />
            <Select
              label="Trailer"
              value={trailerId}
              onChange={(e) => setTrailerId(e.target.value)}
              options={[
                { value: '', label: 'Unassigned' },
                ...equipment.filter(eq => eq.type === 'TRAILER').map(eq => ({ value: eq.id, label: eq.unitNumber })),
              ]}
            />
          </div>
        </div>

      </form>
    </Modal>
  );
};
