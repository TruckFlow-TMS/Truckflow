import React, { useState } from 'react';
import { Customer, Driver, Equipment, LoadStop } from '../../types/tms';
import { mockStore } from '../../services/mockStore';
import { useAuth } from '../../context/AuthContext';
import { Package, DollarSign, MapPin, Calendar, User, Truck, FileText, Plus, X } from 'lucide-react';

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex justify-center items-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col space-y-0 overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Package size={20} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Book & Create New Load</h2>
              <p className="text-xs text-slate-400">Enter rate confirmation, origin, destination, & initial driver dispatch assignment.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition">
            <X size={18} />
          </button>
        </div>

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
                <label className="block text-slate-400 font-semibold mb-1">Broker / Customer Account*</label>
                <select 
                  required 
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500" 
                  value={brokerId} 
                  onChange={e => setBrokerId(e.target.value)}
                >
                  <option value="">Select Broker...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Broker Reference / Load #*</label>
                <input 
                  required 
                  type="text" 
                  placeholder="e.g. REF-88492"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500" 
                  value={brokerReference} 
                  onChange={e => setBrokerReference(e.target.value)} 
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Gross Agreed Rate ($)*</label>
                <input 
                  required 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  placeholder="0.00"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                  value={rate || ''} 
                  onChange={e => setRate(Number(e.target.value))} 
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800/80"></div>

          {/* Section 2: Route & Mileage */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-slate-300 font-bold uppercase tracking-wider text-[11px]">
              <MapPin size={15} className="text-blue-400" />
              <span>Route & Mileage Specs</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pickup / Origin</span>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Origin City (e.g. Chicago)" className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={originCity} onChange={e => setOriginCity(e.target.value)} />
                  <input type="text" placeholder="State (e.g. IL)" className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={originState} onChange={e => setOriginState(e.target.value)} />
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] mb-1">Pickup Date</label>
                  <input type="date" className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500" value={pickupDate} onChange={e => setPickupDate(e.target.value)} />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Delivery / Destination</span>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Dest City (e.g. Atlanta)" className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={destCity} onChange={e => setDestCity(e.target.value)} />
                  <input type="text" placeholder="State (e.g. GA)" className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={destState} onChange={e => setDestState(e.target.value)} />
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] mb-1">Delivery Date</label>
                  <input type="date" className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Loaded Miles</label>
                <input type="number" placeholder="0" className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500" value={loadedMiles || ''} onChange={e => setLoadedMiles(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Deadhead Miles</label>
                <input type="number" placeholder="0" className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500" value={deadheadMiles || ''} onChange={e => setDeadheadMiles(Number(e.target.value))} />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800/80"></div>

          {/* Section 3: Driver & Equipment Assignment */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-slate-300 font-bold uppercase tracking-wider text-[11px]">
              <Truck size={15} className="text-blue-400" />
              <span>Initial Dispatch Assignment (Optional)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Assigned Driver</label>
                <select className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={driverId} onChange={e => setDriverId(e.target.value)}>
                  <option value="">Unassigned</option>
                  {drivers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.status})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Assigned Truck</label>
                <select className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={truckId} onChange={e => setTruckId(e.target.value)}>
                  <option value="">Unassigned</option>
                  {equipment.filter(eq => eq.type === 'TRUCK').map(eq => <option key={eq.id} value={eq.id}>{eq.unitNumber}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Assigned Trailer</label>
                <select className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={trailerId} onChange={e => setTrailerId(e.target.value)}>
                  <option value="">Unassigned</option>
                  {equipment.filter(eq => eq.type === 'TRAILER').map(eq => <option key={eq.id} value={eq.id}>{eq.unitNumber}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Internal Load Notes & Commodity Instructions</label>
            <textarea className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Special instructions, appointment numbers, commodity info..."></textarea>
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center space-x-1.5">
              <Plus size={16} />
              <span>{isSubmitting ? 'Booking Load...' : 'Confirm & Book Load'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
