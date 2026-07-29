import React, { useState } from 'react';
import { Load, Driver, Equipment } from '../../types/tms';
import { mockStore } from '../../services/mockStore';
import { useAuth } from '../../context/AuthContext';
import { Truck, Users, AlertTriangle, X, Check } from 'lucide-react';

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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex justify-center items-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden space-y-0">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Truck size={18} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Assign Dispatch</h2>
              <p className="text-[11px] text-slate-400 font-mono">Load #{load.loadNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition">
            <X size={18} />
          </button>
        </div>
        
        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Driver Assignment</label>
            <select className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={driverId} onChange={e => setDriverId(e.target.value)}>
              <option value="">Unassigned</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.status})</option>
              ))}
            </select>
            {cdlWarning && (
              <div className="mt-2 p-2.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-[11px] flex items-center space-x-2">
                <AlertTriangle size={14} className="text-rose-400 shrink-0" />
                <span>Warning: Selected driver's CDL is expired.</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Truck Power Unit</label>
            <select className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={truckId} onChange={e => setTruckId(e.target.value)}>
              <option value="">Unassigned</option>
              {equipment.filter(eq => eq.type === 'TRUCK').map(eq => (
                <option key={eq.id} value={eq.id}>{eq.unitNumber} ({eq.makeModel})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Trailer Unit</label>
            <select className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={trailerId} onChange={e => setTrailerId(e.target.value)}>
              <option value="">Unassigned</option>
              {equipment.filter(eq => eq.type === 'TRAILER').map(eq => (
                <option key={eq.id} value={eq.id}>{eq.unitNumber}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition">
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center space-x-1.5">
              <Check size={16} />
              <span>{isSaving ? 'Saving...' : 'Confirm Assignment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
