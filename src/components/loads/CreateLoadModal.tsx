import React, { useState } from 'react';
import { Customer, Driver, Equipment, LoadStop } from '../../types/tms';
import { mockStore } from '../../services/mockStore';
import { useAuth } from '../../context/AuthContext';
import { DollarSign, MapPin, Truck, Plus } from 'lucide-react';
import { Modal, Card, Input, Select, Textarea, Button } from '../ui';

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
  const [brokerId, setBrokerId] = useState('');
  const [brokerReference, setBrokerReference] = useState('');
  const [rate, setRate] = useState(0);
  const [originCity, setOriginCity] = useState('');
  const [originState, setOriginState] = useState('');
  const [destCity, setDestCity] = useState('');
  const [destState, setDestState] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [driverId, setDriverId] = useState('');
  const [truckId, setTruckId] = useState('');
  const [trailerId, setTrailerId] = useState('');
  const [loadedMiles, setLoadedMiles] = useState(0);
  const [deadheadMiles, setDeadheadMiles] = useState(0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [stops, setStops] = useState<Partial<LoadStop>[]>([
    { sequence: 1, type: 'PICKUP', facilityName: '', city: '', state: '', zip: '', address: '', appointmentWindowStart: '', appointmentWindowEnd: '' },
    { sequence: 2, type: 'DELIVERY', facilityName: '', city: '', state: '', zip: '', address: '', appointmentWindowStart: '', appointmentWindowEnd: '' }
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSubmitting(true);

    try {
      const selectedCustomer = customers.find(c => c.id === brokerId);

      const newLoad = {
        brokerId,
        brokerName: selectedCustomer?.name || '',
        brokerReference,
        rateMinor: rate * 100,
        currency: 'USD',
        originCity,
        originState,
        destCity,
        destState,
        pickupDate,
        deliveryDate,
        loadedMiles,
        deadheadMiles,
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Book & create new load"
      subtitle="Enter rate confirmation, origin, destination, and initial driver dispatch assignment."
      size="lg"
      busy={isSubmitting}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" form="create-load-form" icon={<Plus size={14} />} loading={isSubmitting}>
            {isSubmitting ? 'Booking load…' : 'Confirm & book load'}
          </Button>
        </>
      }
    >
      <form id="create-load-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Customer & Rates */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-fg-2 font-semibold uppercase tracking-wide text-[11px]">
            <DollarSign size={14} className="text-accent" />
            <span>Customer & rate information</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Broker / customer account*"
              required
              value={brokerId}
              onChange={e => setBrokerId(e.target.value)}
              options={[
                { value: '', label: 'Select broker…' },
                ...customers.map(c => ({ value: c.id, label: c.name })),
              ]}
            />
            <Input
              label="Broker reference / load #*"
              required
              type="text"
              placeholder="e.g. REF-88492"
              value={brokerReference}
              onChange={e => setBrokerReference(e.target.value)}
              className="tnum"
            />
            <Input
              label="Gross agreed rate ($)*"
              required
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={rate || ''}
              onChange={e => setRate(Number(e.target.value))}
              className="tnum text-pos font-semibold"
            />
          </div>
        </div>

        <div className="border-t border-bd" />

        {/* Section 2: Route & Mileage */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-fg-2 font-semibold uppercase tracking-wide text-[11px]">
            <MapPin size={14} className="text-accent" />
            <span>Route & mileage specs</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="space-y-3">
              <span className="text-[10.5px] text-fg-3 font-semibold uppercase tracking-wide block">Pickup / origin</span>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Origin city (e.g. Chicago)" value={originCity} onChange={e => setOriginCity(e.target.value)} />
                <Input placeholder="State (e.g. IL)" value={originState} onChange={e => setOriginState(e.target.value)} />
              </div>
              <Input label="Pickup date" type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)} className="tnum" />
            </Card>

            <Card className="space-y-3">
              <span className="text-[10.5px] text-fg-3 font-semibold uppercase tracking-wide block">Delivery / destination</span>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Dest city (e.g. Atlanta)" value={destCity} onChange={e => setDestCity(e.target.value)} />
                <Input placeholder="State (e.g. GA)" value={destState} onChange={e => setDestState(e.target.value)} />
              </div>
              <Input label="Delivery date" type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className="tnum" />
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Loaded miles"
              type="number"
              placeholder="0"
              value={loadedMiles || ''}
              onChange={e => setLoadedMiles(Number(e.target.value))}
              className="tnum"
            />
            <Input
              label="Deadhead miles"
              type="number"
              placeholder="0"
              value={deadheadMiles || ''}
              onChange={e => setDeadheadMiles(Number(e.target.value))}
              className="tnum"
            />
          </div>
        </div>

        <div className="border-t border-bd" />

        {/* Section 3: Driver & Equipment Assignment */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-fg-2 font-semibold uppercase tracking-wide text-[11px]">
            <Truck size={14} className="text-accent" />
            <span>Initial dispatch assignment (optional)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Assigned driver"
              value={driverId}
              onChange={e => setDriverId(e.target.value)}
              options={[
                { value: '', label: 'Unassigned' },
                ...drivers.map(d => ({ value: d.id, label: `${d.name} (${d.status})` })),
              ]}
            />
            <Select
              label="Assigned truck"
              value={truckId}
              onChange={e => setTruckId(e.target.value)}
              options={[
                { value: '', label: 'Unassigned' },
                ...equipment.filter(eq => eq.type === 'TRUCK').map(eq => ({ value: eq.id, label: eq.unitNumber })),
              ]}
            />
            <Select
              label="Assigned trailer"
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
          label="Internal load notes & commodity instructions"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="Special instructions, appointment numbers, commodity info…"
        />
      </form>
    </Modal>
  );
};
