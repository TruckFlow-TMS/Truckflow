import React, { useState } from 'react';
import { Load, Driver, Equipment } from '../../types/tms';
import { mockStore } from '../../services/mockStore';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle, Check } from 'lucide-react';
import { Modal, Select, Button } from '../ui';

interface AssignmentModalProps {
  isOpen: boolean;
  load: Load | null;
  drivers: Driver[];
  equipment: Equipment[];
  onClose: () => void;
  onReload: () => void;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({
  isOpen, load, drivers, equipment, onClose, onReload
}) => {
  const { currentUser } = useAuth();
  const [driverId, setDriverId] = useState(load?.driverId || '');
  const [truckId, setTruckId] = useState(load?.truckId || '');
  const [trailerId, setTrailerId] = useState(load?.trailerId || '');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !load) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSaving(true);

    try {
      await mockStore.assignDriverAndEquipment(
        load.id,
        driverId,
        truckId,
        trailerId,
        currentUser
      );

      onReload();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedDriver = drivers.find(d => d.id === driverId);
  const now = new Date();
  let cdlWarning = false;

  if (selectedDriver && selectedDriver.cdlExpiration) {
    const exp = new Date(selectedDriver.cdlExpiration);
    if (exp < now) {
      cdlWarning = true;
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign dispatch"
      subtitle={`Load #${load.loadNumber}`}
      busy={isSaving}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button type="submit" form="assignment-form" icon={<Check size={14} />} loading={isSaving}>
            {isSaving ? 'Saving…' : 'Confirm assignment'}
          </Button>
        </>
      }
    >
      <form id="assignment-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Select
            label="Driver assignment"
            value={driverId}
            onChange={e => setDriverId(e.target.value)}
            options={[
              { value: '', label: 'Unassigned' },
              ...drivers.map(d => ({ value: d.id, label: `${d.name} (${d.status})` })),
            ]}
          />
          {cdlWarning && (
            <div className="mt-2 p-2.5 rounded-ctl bg-danger-bg border border-danger/30 text-danger text-[11px] flex items-center gap-2">
              <AlertTriangle size={14} className="shrink-0" />
              <span>Warning: Selected driver's CDL is expired.</span>
            </div>
          )}
        </div>

        <Select
          label="Truck power unit"
          value={truckId}
          onChange={e => setTruckId(e.target.value)}
          options={[
            { value: '', label: 'Unassigned' },
            ...equipment.filter(eq => eq.type === 'TRUCK').map(eq => ({ value: eq.id, label: `${eq.unitNumber} (${eq.makeModel})` })),
          ]}
        />

        <Select
          label="Trailer unit"
          value={trailerId}
          onChange={e => setTrailerId(e.target.value)}
          options={[
            { value: '', label: 'Unassigned' },
            ...equipment.filter(eq => eq.type === 'TRAILER').map(eq => ({ value: eq.id, label: eq.unitNumber })),
          ]}
        />
      </form>
    </Modal>
  );
};
