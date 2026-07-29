import React, { useState, useEffect } from 'react';
import { Customer, Driver, Equipment, Load } from '../../types/tms';
import { mockStore } from '../../services/mockStore';
import { useAuth } from '../../context/AuthContext';
import { DollarSign, MapPin, Truck, AlertTriangle, Check } from 'lucide-react';
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

export const EditLoadModal: React.FC<EditLoadModalProps> = ({
  isOpen, load, customers, drivers, equipment, onClose, onReload
}) => {
  const { currentUser } = useAuth();
  const [brokerId, setBrokerId] = useState(load?.brokerId || '');
  const [brokerReference, setBrokerReference] = useState(load?.brokerReference || '');
  const [rate, setRate] = useState((load?.rateMinor || 0) / 100);
  const [originCity, setOriginCity] = useState(load?.originCity || '');
  const [originState, setOriginState] = useState(load?.originState || '');
  const [destCity, setDestCity] = useState(load?.destCity || '');
  const [destState, setDestState] = useState(load?.destState || '');
  const [pickupDate, setPickupDate] = useState(load?.pickupDate || '');
  const [deliveryDate, setDeliveryDate] = useState(load?.deliveryDate || '');
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
      setOriginCity(load.originCity || '');
      setOriginState(load.originState || '');
      setDestCity(load.destCity || '');
      setDestState(load.destState || '');
      setPickupDate(load.pickupDate || '');
      setDeliveryDate(load.deliveryDate || '');
      setDriverId(load.driverId || '');
      setTruckId(load.truckId || '');
      setTrailerId(load.trailerId || '');
      setLoadedMiles(load.loadedMiles || 0);
      setDeadheadMiles(load.deadheadMiles || 0);
      setNotes(load.notes || '');
    }
  }, [load]);

  if (!isOpen || !load) return null;

  const isPaid = load.status === 'PAID';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || isPaid) return;
    setIsSaving(true);

    try {
      const selectedCustomer = customers.find(c => c.id === brokerId);

      const updatedLoad = {
        brokerId,
        brokerName: selectedCustomer?.name || load.brokerName,
        brokerReference,
        rateMinor: rate * 100,
        originCity,
        originState,
        destCity,
        destState,
        pickupDate,
        deliveryDate,
        loadedMiles,
        deadheadMiles,
        notes,
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit load"
      subtitle={`${load.loadNumber} — update rates, route cities, dates, or driver assignment.`}
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

        {/* Section 2: Route Specs */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-fg-2 font-semibold uppercase tracking-wide text-[11px]">
            <MapPin size={14} className="text-accent" />
            <span>Route & mileage specs</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="space-y-3">
              <span className="text-[10.5px] text-fg-3 font-semibold uppercase tracking-wide block">Pickup / origin</span>
              <div className="grid grid-cols-2 gap-2">
                <Input disabled={isPaid} placeholder="Origin city" value={originCity} onChange={e => setOriginCity(e.target.value)} />
                <Input disabled={isPaid} placeholder="State" value={originState} onChange={e => setOriginState(e.target.value)} />
              </div>
              <Input label="Pickup date" disabled={isPaid} type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)} className="tnum" />
            </Card>

            <Card className="space-y-3">
              <span className="text-[10.5px] text-fg-3 font-semibold uppercase tracking-wide block">Delivery / destination</span>
              <div className="grid grid-cols-2 gap-2">
                <Input disabled={isPaid} placeholder="Dest city" value={destCity} onChange={e => setDestCity(e.target.value)} />
                <Input disabled={isPaid} placeholder="State" value={destState} onChange={e => setDestState(e.target.value)} />
              </div>
              <Input label="Delivery date" disabled={isPaid} type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className="tnum" />
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
