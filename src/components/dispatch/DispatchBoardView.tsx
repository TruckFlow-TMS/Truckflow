import React, { useState } from 'react';
import { Load, LoadStatus, Driver, Equipment } from '../../types/tms';
import { useAuth } from '../../context/AuthContext';
import { mockStore } from '../../services/mockStore';
import {
  Kanban,
  Calendar,
  AlertTriangle,
  UserCheck,
  Truck,
  ArrowRight,
  Plus,
  CheckCircle2,
  XCircle,
  FileCheck,
  FileText,
  DollarSign
} from 'lucide-react';

interface DispatchBoardViewProps {
  loads: Load[];
  drivers: Driver[];
  equipment: Equipment[];
  onSelectLoad: (load: Load) => void;
  onOpenAssignModal: (load: Load) => void;
  onOpenCreateLoad: () => void;
  onReload: () => void;
}

export const DispatchBoardView: React.FC<DispatchBoardViewProps> = ({
  loads,
  drivers,
  equipment,
  onSelectLoad,
  onOpenAssignModal,
  onOpenCreateLoad,
  onReload,
}) => {
  const { currentUser } = useAuth();
  const [viewMode, setViewMode] = useState<'kanban' | 'timeline'>('kanban');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 7-Stage Lifecycle Columns
  const columns: { status: LoadStatus; title: string; color: string }[] = [
    { status: 'OPEN', title: '1. Planned Load', color: 'border-blue-500/40 text-blue-600 dark:text-blue-400 bg-blue-500/10' },
    { status: 'DISPATCHED', title: '2. Trip (Dispatched)', color: 'border-purple-500/40 text-purple-600 dark:text-purple-400 bg-purple-500/10' },
    { status: 'IN_TRANSIT', title: '3. In Transit', color: 'border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10' },
    { status: 'DELIVERED', title: '4. Delivered', color: 'border-indigo-500/40 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10' },
    { status: 'DELIVERED_POD', title: '5. Delivered with (BOL)', color: 'border-teal-500/40 text-teal-600 dark:text-teal-400 bg-teal-500/10' },
    { status: 'INVOICED', title: '6. Invoice', color: 'border-cyan-500/40 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10' },
    { status: 'PAID', title: '7. Paid', color: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' },
  ];

  const handleAdvanceStatus = async (load: Load, targetStatus: LoadStatus) => {
    if (!currentUser) return;
    setErrorMessage(null);
    try {
      if (targetStatus === 'INVOICED') {
        await mockStore.generateInvoice(load.id, currentUser);
      } else {
        await mockStore.updateLoadStatus(load.id, targetStatus, currentUser);
      }
      onReload();
    } catch (err: any) {
      setErrorMessage(err.message || 'Transition guard blocked action');
    }
  };

  return (
    <div className="space-y-6">
      {/* Board Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <Kanban className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Interactive Dispatch Board (7 Stages)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Planned Load → Trip (Dispatched) → In Transit → Delivered → Delivered with (BOL) → Invoice → Paid
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 flex items-center space-x-1 text-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center space-x-1.5 ${
                viewMode === 'kanban'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban Board</span>
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center space-x-1.5 ${
                viewMode === 'timeline'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Driver Timeline</span>
            </button>
          </div>

          <button
            onClick={onOpenCreateLoad}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Book Load</span>
          </button>
        </div>
      </div>

      {/* Error Alert Box */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-100 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start justify-between shadow-lg">
          <div className="flex items-start space-x-3">
            <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-900 dark:text-rose-100">Lifecycle Guard Blocked Transition</p>
              <p className="text-rose-700 dark:text-rose-300 mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-600 dark:text-rose-400 hover:text-rose-900 dark:hover:text-rose-200">
            ✕
          </button>
        </div>
      )}

      {/* View 1: 7-Stage Kanban Swimlanes */}
      {viewMode === 'kanban' && (
        <div className="overflow-x-auto pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 min-w-[1400px]">
            {columns.map((col) => {
              const colLoads = loads.filter((l) => {
                if (col.status === 'IN_TRANSIT') {
                  return ['AT_PICKUP', 'LOADED', 'IN_TRANSIT', 'AT_DELIVERY'].includes(l.status);
                }
                return l.status === col.status;
              });

              return (
                <div key={col.status} className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 flex flex-col min-h-[550px]">
                  <div className={`p-2.5 rounded-xl border flex items-center justify-between font-bold text-[11px] mb-3 ${col.color}`}>
                    <span className="truncate pr-1">{col.title}</span>
                    <span className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-950/60 text-slate-800 dark:text-slate-200 font-mono text-[10px]">
                      {colLoads.length}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                    {colLoads.map((ld) => (
                      <div
                        key={ld.id}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 rounded-xl p-3 shadow-sm dark:shadow-lg transition space-y-2 group"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            onClick={() => onSelectLoad(ld)}
                            className="font-mono font-extrabold text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                          >
                            {ld.loadNumber}
                          </span>
                          <span className="text-[11px] font-mono text-slate-900 dark:text-slate-300 font-bold">
                            ${(ld.rateMinor / 100).toLocaleString('en-US')}
                          </span>
                        </div>

                        <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{ld.brokerName}</p>

                        <div className="text-[10px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/60 p-2 rounded-lg border border-slate-200 dark:border-slate-800/80">
                          <div className="font-semibold text-slate-900 dark:text-slate-300 truncate">
                            {ld.stops[0]?.city || ld.originCity}, {ld.stops[0]?.state || ld.originState} → {ld.stops[ld.stops.length - 1]?.city || ld.destCity}, {ld.stops[ld.stops.length - 1]?.state || ld.destState}
                          </div>
                          <div className="text-[9px] text-slate-500 mt-0.5 font-mono">
                            {ld.loadedMiles} mi ({ld.deadheadMiles} DH)
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] pt-0.5">
                          {ld.driverName ? (
                            <span className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-medium truncate">
                              <UserCheck className="w-3 h-3 shrink-0" />
                              <span className="truncate">{ld.driverName}</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => onOpenAssignModal(ld)}
                              className="flex items-center space-x-1 text-amber-600 dark:text-amber-400 hover:underline font-bold bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800/40"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              <span>Assign</span>
                            </button>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px]">
                          <button onClick={() => onSelectLoad(ld)} className="text-slate-400 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-[9px]">
                            Details
                          </button>

                          {/* Stage Transition Buttons */}
                          {ld.status === 'OPEN' && (
                            <button
                              onClick={() => onOpenAssignModal(ld)}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-2 py-0.5 rounded-lg transition flex items-center space-x-1 text-[10px]"
                            >
                              <span>Dispatch</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}

                          {ld.status === 'DISPATCHED' && (
                            <button
                              onClick={() => handleAdvanceStatus(ld, 'IN_TRANSIT')}
                              className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-2 py-0.5 rounded-lg transition flex items-center space-x-1 text-[10px]"
                            >
                              <span>Transit</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}

                          {['AT_PICKUP', 'LOADED', 'IN_TRANSIT', 'AT_DELIVERY'].includes(ld.status) && (
                            <button
                              onClick={() => handleAdvanceStatus(ld, 'DELIVERED')}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-2 py-0.5 rounded-lg transition flex items-center space-x-1 text-[10px]"
                            >
                              <span>Delivered</span>
                              <CheckCircle2 className="w-3 h-3" />
                            </button>
                          )}

                          {ld.status === 'DELIVERED' && (
                            <button
                              onClick={() => handleAdvanceStatus(ld, 'DELIVERED_POD')}
                              className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-2 py-0.5 rounded-lg transition flex items-center space-x-1 text-[10px]"
                            >
                              <span>+ BOL</span>
                              <FileCheck className="w-3 h-3" />
                            </button>
                          )}

                          {ld.status === 'DELIVERED_POD' && (
                            <button
                              onClick={() => handleAdvanceStatus(ld, 'INVOICED')}
                              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-2 py-0.5 rounded-lg transition flex items-center space-x-1 text-[10px]"
                            >
                              <span>Invoice</span>
                              <FileText className="w-3 h-3" />
                            </button>
                          )}

                          {ld.status === 'INVOICED' && (
                            <button
                              onClick={() => handleAdvanceStatus(ld, 'PAID')}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2 py-0.5 rounded-lg transition flex items-center space-x-1 text-[10px]"
                            >
                              <span>Paid</span>
                              <DollarSign className="w-3 h-3" />
                            </button>
                          )}

                          {ld.status === 'PAID' && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono text-[9px] flex items-center space-x-0.5">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Closed</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    {colLoads.length === 0 && (
                      <div className="p-4 text-center text-slate-400 dark:text-slate-500 text-[11px] italic border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                        Empty
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View 2: Driver Timeline */}
      {viewMode === 'timeline' && (
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Driver Roster & Equipment Schedule Timeline</span>
          </h3>

          <div className="space-y-4 text-xs">
            {drivers.map((drv) => {
              const driverLoads = loads.filter((l) => l.driverId === drv.id);

              return (
                <div key={drv.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-blue-600/20 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center border border-blue-500/30">
                        {drv.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 dark:text-slate-100">{drv.name}</span>
                          <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 px-2 py-0.5 rounded">
                            {drv.employmentType}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Truck: <span className="text-blue-600 dark:text-blue-400 font-mono font-semibold">{drv.assignedTruckNumber || 'None'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Assigned Loads</span>
                      <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">{driverLoads.length} Active</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    {driverLoads.map((l) => (
                      <div
                        key={l.id}
                        onClick={() => onSelectLoad(l)}
                        className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 hover:border-blue-500/60 transition cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">{l.loadNumber}</span>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                            {l.stops[0]?.city || l.originCity} → {l.stops[l.stops.length - 1]?.city || l.destCity}
                          </p>
                        </div>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">
                          {l.status}
                        </span>
                      </div>
                    ))}
                    {driverLoads.length === 0 && (
                      <span className="text-slate-500 italic text-[11px]">No loads assigned.</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
