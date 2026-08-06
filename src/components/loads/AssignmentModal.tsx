import React, { useState } from 'react';
import { Load, Driver, Equipment } from '../../types/tms';
import { mockStore } from '../../services/mockStore';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle, Check, Link2 } from 'lucide-react';
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

  const pairedTrailer = equipment.find(
    eq => eq.type === 'TRAILER' && eq.id === equipment.find(t => t.id === truckId)?.linkedEquipmentId,
  );

  /**
   * Picking a tractor pre-fills the trailer it is hooked to. Only when the
   * trailer field is still empty — a dispatcher who already chose a trailer
   * meant it, and having the truck overwrite that choice would be worse than
   * not helping at all.
   */
  const handlePickTruck = (nextTruckId: string) => {
    setTruckId(nextTruckId);
    if (trailerId) return;
    const linked = equipment.find(t => t.id === nextTruckId)?.linkedEquipmentId;
    if (linked) setTrailerId(linked);
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
          onChange={e => handlePickTruck(e.target.value)}
          options={[
            { value: '', label: 'Unassigned' },
            ...equipment.filter(eq => eq.type === 'TRUCK').map(eq => {
              const trailer = equipment.find(t => t.id === eq.linkedEquipmentId);
              return {
                value: eq.id,
                label: `${eq.unitNumber} (${eq.makeModel})${trailer ? ` · pulls ${trailer.unitNumber}` : ''}`,
              };
            }),
          ]}
        />

        <div>
          <Select
            label="Trailer unit"
            value={trailerId}
            onChange={e => setTrailerId(e.target.value)}
            options={[
              { value: '', label: 'Unassigned' },
              ...equipment.filter(eq => eq.type === 'TRAILER').map(eq => {
                const truck = equipment.find(t => t.id === eq.linkedEquipmentId);
                return { value: eq.id, label: truck ? `${eq.unitNumber} · linked to ${truck.unitNumber}` : eq.unitNumber };
              }),
            ]}
          />
          {pairedTrailer && trailerId === pairedTrailer.id && (
            <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-fg-3">
              <Link2 size={12} className="shrink-0" />
              Filled from the truck's linked trailer — change it if this run is different.
            </p>
          )}
        </div>
      </form>
    </Modal>
  );
};
