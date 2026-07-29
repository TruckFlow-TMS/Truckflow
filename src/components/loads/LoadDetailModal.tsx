import React, { useState } from 'react';
import { Load } from '../../types/tms';
import { mockStore } from '../../services/mockStore';
import { useAuth } from '../../context/AuthContext';
import { Package, ArrowRight, Upload, DollarSign, FileText, Activity, MapPin, Truck, X, CheckCircle } from 'lucide-react';

interface LoadDetailModalProps {
  load: Load | null;
  onClose: () => void;
  onReload: () => void;
}

export const LoadDetailModal: React.FC<LoadDetailModalProps> = ({ load, onClose, onReload }) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'STOPS' | 'DOCUMENTS' | 'FINANCIALS' | 'ACTIVITY'>('OVERVIEW');
  const [docType, setDocType] = useState('BOL');
  const [docName, setDocName] = useState('');
  const [isAdvancing, setIsAdvancing] = useState(false);

  if (!load) return null;

  const handleAdvanceStatus = async () => {
    if (!currentUser) return;
    setIsAdvancing(true);
    try {
      const statuses = ['OPEN', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'INVOICED', 'PAID'];
      const currentIndex = statuses.indexOf(load.status);
      if (currentIndex >= 0 && currentIndex < statuses.length - 1) {
        await mockStore.updateLoadStatus(load.id, statuses[currentIndex + 1] as any, currentUser);
        onReload();
      }
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    await mockStore.uploadDocument(
      load.id,
      {
        type: docType as any,
        name: docName,
        version: 1,
        uploadedBy: currentUser.name,
        fileUrl: '#',
      },
      currentUser
    );
    setDocName('');
    onReload();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex justify-center items-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/60 shrink-0">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Package size={20} />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-lg font-extrabold text-white">Load {load.loadNumber}</h2>
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${
                  load.status === 'DELIVERED' || load.status === 'PAID'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : load.status === 'IN_TRANSIT' || load.status === 'DISPATCHED'
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {load.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center space-x-1.5 font-mono">
                <span>{load.originCity}, {load.originState}</span>
                <ArrowRight size={12} className="text-slate-500" />
                <span>{load.destCity}, {load.destState}</span>
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition">
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-950 border-b border-slate-800 px-6 shrink-0 space-x-2">
          {[
            { id: 'OVERVIEW', label: 'Overview' },
            { id: 'STOPS', label: 'Stops & Route' },
            { id: 'DOCUMENTS', label: 'Documents & Rate Cons' },
            { id: 'FINANCIALS', label: 'Financial Breakdown' },
            { id: 'ACTIVITY', label: 'Audit Trail' }
          ].map(tab => (
            <button
              key={tab.id}
              className={`py-3 px-4 text-xs font-bold transition border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400 bg-slate-900/50'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 text-xs text-slate-300">
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400">Broker & Customer Details</h3>
                  <div className="space-y-1 text-xs">
                    <p><span className="text-slate-500">Name:</span> <strong className="text-white">{load.brokerName}</strong></p>
                    <p><span className="text-slate-500">Broker Ref #:</span> <span className="font-mono text-blue-400 font-bold">{load.brokerReference}</span></p>
                    <p><span className="text-slate-500">Gross Rate:</span> <span className="font-mono text-emerald-400 font-bold">${(load.rateMinor / 100).toFixed(2)}</span></p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400">Driver & Equipment Assignment</h3>
                  <div className="space-y-1 text-xs">
                    <p><span className="text-slate-500">Driver:</span> <strong className="text-white">{load.driverName || 'Unassigned'}</strong></p>
                    <p><span className="text-slate-500">Truck Unit #:</span> <span className="font-mono text-slate-200">{load.truckNumber || 'Unassigned'}</span></p>
                    <p><span className="text-slate-500">Trailer #:</span> <span className="font-mono text-slate-200">{load.trailerNumber || 'Unassigned'}</span></p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white">Status Workflow Advancement</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Current active status is <span className="font-mono font-bold text-blue-400">{load.status}</span></p>
                </div>
                {load.status !== 'PAID' && load.status !== 'CANCELLED' && (
                  <button 
                    disabled={isAdvancing} 
                    onClick={handleAdvanceStatus}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center space-x-1.5"
                  >
                    <CheckCircle size={15} />
                    <span>{isAdvancing ? 'Updating...' : 'Advance Next Status'}</span>
                  </button>
                )}
              </div>

              {load.notes && (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <h4 className="font-bold text-slate-400 text-[11px] uppercase tracking-wider">Internal Notes</h4>
                  <p className="text-slate-300">{load.notes}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'STOPS' && (
            <div className="space-y-4">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider">Route Stops & Appointments</h3>
              {load.stops && load.stops.length > 0 ? load.stops.map(stop => (
                <div key={stop.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-2 inline-block">
                        {stop.type} — Stop #{stop.sequence}
                      </span>
                      <p className="font-bold text-white text-sm">{stop.facilityName || 'Facility'}</p>
                      <p className="text-slate-400 text-xs">{stop.address}, {stop.city}, {stop.state} {stop.zip}</p>
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-slate-500 italic">No custom stops configured.</p>
              )}
            </div>
          )}

          {activeTab === 'DOCUMENTS' && (
            <div className="space-y-6">
              <form onSubmit={handleUploadDoc} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-end space-x-3">
                <div className="flex-1">
                  <label className="block text-slate-400 font-semibold mb-1">Document Type</label>
                  <select className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={docType} onChange={e => setDocType(e.target.value)}>
                    <option value="BOL">Bill of Lading (BOL)</option>
                    <option value="RATE_CON">Rate Confirmation</option>
                    <option value="POD">Proof of Delivery (POD)</option>
                    <option value="RECEIPT">Expense Receipt</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-slate-400 font-semibold mb-1">File Description</label>
                  <input required type="text" className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={docName} onChange={e => setDocName(e.target.value)} placeholder="e.g. Signed Rate Con" />
                </div>
                <button type="submit" className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center space-x-1.5 h-[42px]">
                  <Upload size={15} />
                  <span>Upload</span>
                </button>
              </form>

              <div className="space-y-2">
                {load.documents && load.documents.length > 0 ? load.documents.map(doc => (
                  <div key={doc.id} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-white">{doc.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{doc.type} • Uploaded by {doc.uploadedBy} on {new Date(doc.uploadedAt).toLocaleString()}</p>
                    </div>
                    <button className="text-blue-400 hover:underline font-bold text-xs">View Document</button>
                  </div>
                )) : <p className="text-slate-500 italic">No documents attached yet.</p>}
              </div>
            </div>
          )}

          {activeTab === 'FINANCIALS' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex justify-between items-center text-sm">
                <span className="text-slate-400 font-semibold">Agreed Base Gross Rate</span>
                <span className="font-mono font-extrabold text-emerald-400 text-base">${(load.rateMinor / 100).toFixed(2)}</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider">Accessorials & Fuel Surcharge</h3>
                {load.accessorials && load.accessorials.length > 0 ? load.accessorials.map(acc => (
                  <div key={acc.id} className="flex justify-between items-center border-b border-slate-800 py-1.5 text-xs">
                    <span className="text-slate-300">{acc.type} - {acc.description}</span>
                    <span className="font-mono text-emerald-400">${(acc.billableAmountMinor / 100).toFixed(2)}</span>
                  </div>
                )) : <p className="text-slate-500 italic">No extra accessorials attached.</p>}
              </div>
            </div>
          )}

          {activeTab === 'ACTIVITY' && (
            <div className="p-6 text-center text-slate-500 italic">
              Audit log activity stream for Load #{load.loadNumber}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
