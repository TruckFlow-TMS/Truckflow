import React, { useState, useEffect } from 'react';
import { Customer, Driver, Equipment, Load } from '../../types/tms';
import { mockStore } from '../../services/mockStore';
import { useAuth } from '../../context/AuthContext';
import { Edit2, DollarSign, MapPin, Truck, AlertTriangle, X, Check } from 'lucide-react';

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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex justify-center items-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col space-y-0 overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Edit2 size={20} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-extrabold text-white">Edit Load</h2>
                <span className="font-mono text-xs bg-slate-800 text-blue-400 font-bold px-2 py-0.5 rounded">{load.loadNumber}</span>
              </div>
              <p className="text-xs text-slate-400">Update rates, route cities, dates, or driver assignment.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition">
            <X size={18} />
          </button>
        </div>

        {/* Paid Notice Alert */}
        {isPaid && (
          <div className="m-6 p-4 rounded-xl bg-amber-950/60 border border-amber-800 text-amber-200 text-xs flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <span>This load has been marked as <strong>PAID</strong> and is locked against modifications.</span>
          </div>
        )}

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Section 1: Customer & Rates */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-slate-300 font-bold uppercase tracking-wider text-[11px]">
              <DollarSign size={15} className="text-blue-400" />
              <span>Customer & Rate Information</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Customer/Broker Account*</label>
                <select 
                  disabled={isPaid} 
                  required 
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50" 
                  value={brokerId} 
                  onChange={e => setBrokerId(e.target.value)}
                >
                  <option value="">Select...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Broker Reference #*</label>
                <input 
                  disabled={isPaid} 
                  required 
                  type="text" 
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50" 
                  value={brokerReference} 
                  onChange={e => setBrokerReference(e.target.value)} 
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Gross Rate ($)*</label>
                <input 
                  disabled={isPaid} 
                  required 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50" 
                  value={rate} 
                  onChange={e => setRate(Number(e.target.value))} 
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800/80"></div>

          {/* Section 2: Route Specs */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-slate-300 font-bold uppercase tracking-wider text-[11px]">
              <MapPin size={15} className="text-blue-400" />
              <span>Route & Mileage Specs</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pickup / Origin</span>
                <div className="grid grid-cols-2 gap-2">
                  <input disabled={isPaid} type="text" placeholder="Origin City" className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50" value={originCity} onChange={e => setOriginCity(e.target.value)} />
                  <input disabled={isPaid} type="text" placeholder="State" className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50" value={originState} onChange={e => setOriginState(e.target.value)} />
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] mb-1">Pickup Date</label>
                  <input disabled={isPaid} type="date" className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50" value={pickupDate} onChange={e => setPickupDate(e.target.value)} />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Delivery / Destination</span>
                <div className="grid grid-cols-2 gap-2">
                  <input disabled={isPaid} type="text" placeholder="Dest City" className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50" value={destCity} onChange={e => setDestCity(e.target.value)} />
                  <input disabled={isPaid} type="text" placeholder="State" className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50" value={destState} onChange={e => setDestState(e.target.value)} />
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] mb-1">Delivery Date</label>
                  <input disabled={isPaid} type="date" className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Loaded Miles</label>
                <input disabled={isPaid} type="number" className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50" value={loadedMiles} onChange={e => setLoadedMiles(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Deadhead Miles</label>
                <input disabled={isPaid} type="number" className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50" value={deadheadMiles} onChange={e => setDeadheadMiles(Number(e.target.value))} />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800/80"></div>

          {/* Section 3: Driver & Equipment */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-slate-300 font-bold uppercase tracking-wider text-[11px]">
              <Truck size={15} className="text-blue-400" />
              <span>Dispatch Assignment</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Assign Driver</label>
                <select disabled={isPaid} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50" value={driverId} onChange={e => setDriverId(e.target.value)}>
                  <option value="">Unassigned</option>
                  {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Assign Truck</label>
                <select disabled={isPaid} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50" value={truckId} onChange={e => setTruckId(e.target.value)}>
                  <option value="">Unassigned</option>
                  {equipment.filter(eq => eq.type === 'TRUCK').map(eq => <option key={eq.id} value={eq.id}>{eq.unitNumber}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Assign Trailer</label>
                <select disabled={isPaid} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50" value={trailerId} onChange={e => setTrailerId(e.target.value)}>
                  <option value="">Unassigned</option>
                  {equipment.filter(eq => eq.type === 'TRAILER').map(eq => <option key={eq.id} value={eq.id}>{eq.unitNumber}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Notes</label>
            <textarea disabled={isPaid} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50" value={notes} onChange={e => setNotes(e.target.value)} rows={3}></textarea>
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition">
              Cancel
            </button>
            {!isPaid && (
              <button type="submit" disabled={isSaving} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center space-x-1.5">
                <Check size={16} />
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
