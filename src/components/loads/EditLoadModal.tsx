import React, { useState, useEffect } from 'react';
import { Customer, Driver, Equipment, Load, LoadStop } from '../../types/tms';
import { mockStore } from '../../services/mockStore';
import { useAuth } from '../../context/AuthContext';
import { DollarSign, MapPin, Truck, AlertTriangle, Check, Plus, Trash2 } from 'lucide-react';
import { Modal, Card, Input, Select, Textarea, Button } from '../ui';

interface EditLoadModalProps {
  isOpen: boolean;
  load: Load | null;
  customers: Customer[];
  drivers: Driver[];
  equipment: Equipment[];
  onClose: () => void;
  onReload: () => void;
}

interface StopData {
  id?: string;
  facilityName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  date: string;
  referenceNumber: string;
  status: 'PENDING' | 'ARRIVED' | 'DEPARTED' | 'COMPLETED';
  arrivedAt: string;
  departedAt: string;
}

const emptyStop = (type: 'pickup' | 'delivery', city = '', state = '', date = ''): StopData => ({
  facilityName: '',
  address: '',
  city,
  state,
  zip: '',
  date,
  referenceNumber: '',
  status: 'PENDING',
  arrivedAt: '',
  departedAt: '',
});

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
];

export const EditLoadModal: React.FC<EditLoadModalProps> = ({
  isOpen, load, customers, drivers, equipment, onClose, onReload
}) => {
  const { currentUser } = useAuth();
  const [brokerId, setBrokerId] = useState(load?.brokerId || '');
  const [brokerReference, setBrokerReference] = useState(load?.brokerReference || '');
  const [rate, setRate] = useState((load?.rateMinor || 0) / 100);

  const [isMultiStop, setIsMultiStop] = useState(false);
  const [pickups, setPickups] = useState<StopData[]>([]);
  const [deliveries, setDeliveries] = useState<StopData[]>([]);

  const [driverId, setDriverId] = useState(load?.driverId || '');
  const [truckId, setTruckId] = useState(load?.truckId || '');
  const [trailerId, setTrailerId] = useState(load?.trailerId || '');
  const [loadedMiles, setLoadedMiles] = useState(load?.loadedMiles || 0);
  const [deadheadMiles, setDeadheadMiles] = useState(load?.deadheadMiles || 0);
  const [notes, setNotes] = useState(load?.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (load) {
      setBrokerId(load.brokerId || '');
      setBrokerReference(load.brokerReference || '');
      setRate((load.rateMinor || 0) / 100);
      setDriverId(load.driverId || '');
      setTruckId(load.truckId || '');
      setTrailerId(load.trailerId || '');
      setLoadedMiles(load.loadedMiles || 0);
      setDeadheadMiles(load.deadheadMiles || 0);
      setNotes(load.notes || '');

      const loadStops = load.stops || [];
      const pickupStops = loadStops.filter(s => s.type === 'PICKUP');
      const deliveryStops = loadStops.filter(s => s.type === 'DELIVERY');

      setIsMultiStop(loadStops.length > 2);

      if (pickupStops.length > 0) {
        setPickups(pickupStops.map(s => ({
          id: s.id,
          facilityName: s.facilityName || '',
          address: s.address || '',
          city: s.city || '',
          state: s.state || '',
          zip: s.zip || '',
          date: s.appointmentWindowStart || load.pickupDate || '',
          referenceNumber: s.referenceNumber || '',
          status: s.status || 'PENDING',
          arrivedAt: s.arrivedAt || '',
          departedAt: s.departedAt || '',
        })));
      } else {
        setPickups([emptyStop('pickup', load.originCity || '', load.originState || '', load.pickupDate || '')]);
      }

      if (deliveryStops.length > 0) {
        setDeliveries(deliveryStops.map(s => ({
          id: s.id,
          facilityName: s.facilityName || '',
          address: s.address || '',
          city: s.city || '',
          state: s.state || '',
          zip: s.zip || '',
          date: s.appointmentWindowStart || load.deliveryDate || '',
          referenceNumber: s.referenceNumber || '',
          status: s.status || 'PENDING',
          arrivedAt: s.arrivedAt || '',
          departedAt: s.departedAt || '',
        })));
      } else {
        setDeliveries([emptyStop('delivery', load.destCity || '', load.destState || '', load.deliveryDate || '')]);
      }
    }
  }, [load]);

  if (!isOpen || !load) return null;

  const isPaid = load.status === 'PAID';

  const updateStop = (
    list: StopData[],
    setter: React.Dispatch<React.SetStateAction<StopData[]>>,
    index: number,
    field: keyof StopData,
    value: string
  ) => {
    const copy = [...list];
    copy[index] = { ...copy[index], [field]: value };
    setter(copy);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || isPaid) return;
    setIsSaving(true);

    try {
      const selectedCustomer = customers.find(c => c.id === brokerId);

      const pFirst = pickups[0] || emptyStop('pickup');
      const dLast = deliveries[deliveries.length - 1] || emptyStop('delivery');

      const stops: Partial<LoadStop>[] = [
        ...pickups.map((s, i) => ({
          id: s.id || `stop-pickup-${i + 1}`,
          sequence: i + 1,
          type: 'PICKUP' as const,
          facilityName: s.facilityName,
          city: s.city,
          state: s.state,
          zip: s.zip,
          address: s.address,
          referenceNumber: s.referenceNumber || undefined,
          appointmentWindowStart: s.date,
          appointmentWindowEnd: '',
          status: s.status || 'PENDING',
          arrivedAt: s.arrivedAt || undefined,
          departedAt: s.departedAt || undefined,
        })),
        ...deliveries.map((s, i) => ({
          id: s.id || `stop-delivery-${i + 1}`,
          sequence: pickups.length + i + 1,
          type: 'DELIVERY' as const,
          facilityName: s.facilityName,
          city: s.city,
          state: s.state,
          zip: s.zip,
          address: s.address,
          referenceNumber: s.referenceNumber || undefined,
          appointmentWindowStart: s.date,
          appointmentWindowEnd: '',
          status: s.status || 'PENDING',
          arrivedAt: s.arrivedAt || undefined,
          departedAt: s.departedAt || undefined,
        })),
      ];

      const updatedLoad = {
        brokerId,
        brokerName: selectedCustomer?.name || load.brokerName,
        brokerReference,
        rateMinor: rate * 100,
        originCity: pFirst.city,
        originState: pFirst.state,
        destCity: dLast.city,
        destState: dLast.state,
        pickupDate: pFirst.date,
        deliveryDate: dLast.date,
        loadedMiles,
        deadheadMiles,
        notes,
        stops: stops as LoadStop[],
      };

      await mockStore.updateLoad(load.id, updatedLoad as any, currentUser);

      if (driverId !== load.driverId || truckId !== load.truckId || trailerId !== load.trailerId) {
        await mockStore.assignDriverAndEquipment(load.id, driverId || '', truckId || '', trailerId || '', currentUser);
      }

      onReload();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

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
        {list.length > 1 && !isPaid && (
          <button
            type="button"
            onClick={() => setter(list.filter((_, i) => i !== index))}
            className="w-6 h-6 rounded flex items-center justify-center text-danger hover:bg-danger-bg transition-colors"
            title="Remove stop"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      <Input
        label={type === 'pickup' ? 'Shipper facility' : 'Consignee facility'}
        disabled={isPaid}
        required
        placeholder="Facility / company name"
        value={list[index].facilityName}
        onChange={(e) => updateStop(list, setter, index, 'facilityName', e.target.value)}
      />

      <Input
        label="Street address"
        disabled={isPaid}
        placeholder="Address"
        value={list[index].address}
        onChange={(e) => updateStop(list, setter, index, 'address', e.target.value)}
      />

      <div className="grid grid-cols-3 gap-2">
        <Input
          label="City"
          disabled={isPaid}
          required
          placeholder="City"
          value={list[index].city}
          onChange={(e) => updateStop(list, setter, index, 'city', e.target.value)}
        />
        <Select
          label="State"
          disabled={isPaid}
          value={list[index].state}
          onChange={(e) => updateStop(list, setter, index, 'state', e.target.value)}
          options={[
            { value: '', label: 'State…' },
            ...US_STATES.map(s => ({ value: s, label: s })),
          ]}
        />
        <Input
          label="ZIP"
          disabled={isPaid}
          placeholder="ZIP"
          value={list[index].zip}
          onChange={(e) => updateStop(list, setter, index, 'zip', e.target.value)}
          className="tnum"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <Input
          label={`${type === 'pickup' ? 'Pickup' : 'Delivery'} date`}
          disabled={isPaid}
          required
          type="date"
          value={list[index].date}
          onChange={(e) => updateStop(list, setter, index, 'date', e.target.value)}
          className="tnum"
        />
        <Input
          label="Stop Ref # / BOL #"
          disabled={isPaid}
          placeholder="PO # / BOL # / Ref #"
          value={list[index].referenceNumber}
          onChange={(e) => updateStop(list, setter, index, 'referenceNumber', e.target.value)}
          className="tnum"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <Select
          label="Stop status"
          disabled={isPaid}
          value={list[index].status || 'PENDING'}
          onChange={(e) => updateStop(list, setter, index, 'status', e.target.value as any)}
          options={[
            { value: 'PENDING', label: 'Pending' },
            { value: 'ARRIVED', label: 'Arrived' },
            { value: 'DEPARTED', label: 'Departed' },
            { value: 'COMPLETED', label: 'Completed' },
          ]}
        />
        <Input
          label="Arrival timestamp"
          disabled={isPaid}
          type="datetime-local"
          value={list[index].arrivedAt || ''}
          onChange={(e) => updateStop(list, setter, index, 'arrivedAt', e.target.value)}
          className="tnum text-[11px]"
        />
        <Input
          label="Departure timestamp"
          disabled={isPaid}
          type="datetime-local"
          value={list[index].departedAt || ''}
          onChange={(e) => updateStop(list, setter, index, 'departedAt', e.target.value)}
          className="tnum text-[11px]"
        />
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit load & multi-stop routing"
      subtitle={`${load.loadNumber} — update rates, stops, statuses, timestamps, or driver assignment.`}
      size="lg"
      busy={isSaving}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
          {!isPaid && (
            <Button type="submit" form="edit-load-form" icon={<Check size={14} />} loading={isSaving}>
              {isSaving ? 'Saving…' : 'Save changes'}
            </Button>
          )}
        </>
      }
    >
      {isPaid && (
        <div className="mb-5 p-4 rounded-ctl bg-warn-bg border border-warn/30 text-warn text-[12.5px] flex items-center gap-3">
          <AlertTriangle size={18} className="shrink-0" />
          <span>This load has been marked as <strong>PAID</strong> and is locked against modifications.</span>
        </div>
      )}

      <form id="edit-load-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Customer & Rates */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-fg-2 font-semibold uppercase tracking-wide text-[11px]">
            <DollarSign size={14} className="text-accent" />
            <span>Customer & rate information</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Customer/broker account*"
              disabled={isPaid}
              required
              value={brokerId}
              onChange={e => setBrokerId(e.target.value)}
              options={[
                { value: '', label: 'Select…' },
                ...customers.map(c => ({ value: c.id, label: c.name })),
              ]}
            />
            <Input
              label="Broker reference #*"
              disabled={isPaid}
              required
              type="text"
              value={brokerReference}
              onChange={e => setBrokerReference(e.target.value)}
              className="tnum"
            />
            <Input
              label="Gross rate ($)*"
              disabled={isPaid}
              required
              type="number"
              min="0"
              step="0.01"
              value={rate}
              onChange={e => setRate(Number(e.target.value))}
              className="tnum text-pos font-semibold"
            />
          </div>
        </div>

        <div className="border-t border-bd" />

        {/* Section 2: Route & Stops */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-fg-2 font-semibold uppercase tracking-wide text-[11px]">
              <MapPin size={14} className="text-accent" />
              <span>Route & multi-stop configuration</span>
            </div>

            <div className="inline-flex rounded-ctl bg-surface-2 border border-bd p-0.5 text-[11px]">
              <button
                type="button"
                disabled={isPaid}
                onClick={() => setIsMultiStop(false)}
                className={`px-2.5 py-1 rounded-ctl font-semibold transition ${
                  !isMultiStop ? 'bg-surface text-accent shadow-sm' : 'text-fg-3 hover:text-fg'
                }`}
              >
                📍 Standard Direct
              </button>
              <button
                type="button"
                disabled={isPaid}
                onClick={() => setIsMultiStop(true)}
                className={`px-2.5 py-1 rounded-ctl font-semibold transition ${
                  isMultiStop ? 'bg-surface text-accent shadow-sm' : 'text-fg-3 hover:text-fg'
                }`}
              >
                🔄 Multi-Stop Load
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pickups */}
            <div className="space-y-3">
              {pickups.map((_, i) => renderStop('Pick-up', pickups, setPickups, i, 'pickup'))}
              {!isPaid && isMultiStop && (
                <button
                  type="button"
                  onClick={() => setPickups([...pickups, emptyStop('pickup')])}
                  className="w-full py-2 border border-dashed border-bd rounded-ctl text-[12px] font-semibold text-accent hover:bg-accent-weak/30 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus size={13} /> Add another pickup stop
                </button>
              )}
            </div>

            {/* Deliveries */}
            <div className="space-y-3">
              {deliveries.map((_, i) => renderStop('Delivery', deliveries, setDeliveries, i, 'delivery'))}
              {!isPaid && isMultiStop && (
                <button
                  type="button"
                  onClick={() => setDeliveries([...deliveries, emptyStop('delivery')])}
                  className="w-full py-2 border border-dashed border-bd rounded-ctl text-[12px] font-semibold text-accent hover:bg-accent-weak/30 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus size={13} /> Add another delivery/drop stop
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <Input
              label="Loaded miles"
              disabled={isPaid}
              type="number"
              value={loadedMiles}
              onChange={e => setLoadedMiles(Number(e.target.value))}
              className="tnum"
            />
            <Input
              label="Deadhead miles"
              disabled={isPaid}
              type="number"
              value={deadheadMiles}
              onChange={e => setDeadheadMiles(Number(e.target.value))}
              className="tnum"
            />
          </div>
        </div>

        <div className="border-t border-bd" />

        {/* Section 3: Driver & Equipment */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-fg-2 font-semibold uppercase tracking-wide text-[11px]">
            <Truck size={14} className="text-accent" />
            <span>Dispatch assignment</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Assign driver"
              disabled={isPaid}
              value={driverId}
              onChange={e => setDriverId(e.target.value)}
              options={[
                { value: '', label: 'Unassigned' },
                ...drivers.map(d => ({ value: d.id, label: d.name })),
              ]}
            />
            <Select
              label="Assign truck"
              disabled={isPaid}
              value={truckId}
              onChange={e => setTruckId(e.target.value)}
              options={[
                { value: '', label: 'Unassigned' },
                ...equipment.filter(eq => eq.type === 'TRUCK').map(eq => ({ value: eq.id, label: eq.unitNumber })),
              ]}
            />
            <Select
              label="Assign trailer"
              disabled={isPaid}
              value={trailerId}
              onChange={e => setTrailerId(e.target.value)}
              options={[
                { value: '', label: 'Unassigned' },
                ...equipment.filter(eq => eq.type === 'TRAILER').map(eq => ({ value: eq.id, label: eq.unitNumber })),
              ]}
            />
          </div>
        </div>

        <Textarea
          label="Notes"
          disabled={isPaid}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
        />
      </form>
    </Modal>
  );
};
