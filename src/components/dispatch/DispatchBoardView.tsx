import React, { useState } from 'react';
import { Load, LoadStatus, Driver, Equipment } from '../../types/tms';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/Toast';
import { mockStore } from '../../services/mockStore';
import {
  Button, Card, Badge, Avatar, PageHeader, EmptyState,
  statusTone, humanizeStatus,
} from '../ui';
import {
  Kanban,
  Calendar,
  AlertTriangle,
  Truck,
  ArrowRight,
  Plus,
  CheckCircle2,
  XCircle,
  FileCheck,
  FileText,
  DollarSign,
  Upload,
  Paperclip,
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

const stageAction = 'inline-flex items-center gap-1 px-2 py-1 rounded-ctl text-[10px] font-semibold bg-accent-grad text-on-hero hover:opacity-90 transition';

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
  const { showToast } = useToast();
  const [viewMode, setViewMode] = useState<'kanban' | 'timeline'>('kanban');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Drag & Drop State
  const [draggingLoadId, setDraggingLoadId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<LoadStatus | null>(null);

  // 6-Stage Lifecycle Columns
  const columns: { status: LoadStatus; title: string }[] = [
    { status: 'OPEN', title: '1. Open' },
    { status: 'DISPATCHED', title: '2. Dispatch' },
    { status: 'IN_TRANSIT', title: '3. Transit' },
    { status: 'DELIVERED', title: '4. Delivered' },
    { status: 'INVOICED', title: '5. Invoiced' },
    { status: 'PAID', title: '6. Paid' },
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
      showToast('success', `Moved Load #${load.loadNumber} to ${humanizeStatus(targetStatus)}`);
      onReload();
    } catch (err: any) {
      setErrorMessage(err.message || 'Transition guard blocked action');
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: LoadStatus) => {
    e.preventDefault();
    setDragOverStatus(null);
    const loadId = e.dataTransfer.getData('text/plain') || draggingLoadId;
    if (!loadId) return;
    const targetLoad = loads.find(l => l.id === loadId);
    if (!targetLoad) return;
    if (targetLoad.status === targetStatus) return;

    await handleAdvanceStatus(targetLoad, targetStatus);
    setDraggingLoadId(null);
  };

  const getDocTypeForStage = (status: LoadStatus) => {
    switch (status) {
      case 'DELIVERED':
      case 'DELIVERED_POD': return 'BOL';
      case 'INVOICED': return 'INVOICE_PDF';
      case 'PAID': return 'RECEIPT';
      default: return 'BOL';
    }
  };

  const handleFileUpload = async (load: Load, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    const docType = getDocTypeForStage(load.status);
    try {
      await mockStore.uploadDocument(
        load.id,
        {
          type: docType as any,
          name: file.name,
          version: 1,
          uploadedBy: currentUser.name,
          fileUrl: URL.createObjectURL(file),
        },
        currentUser
      );
      showToast('success', `Uploaded ${file.name} to Load #${load.loadNumber}`);
      onReload();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to upload document.');
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Board Header & View Switcher */}
      <PageHeader
        title="Interactive dispatch board (6 stages)"
        subtitle="1. Open → 2. Dispatch → 3. Transit → 4. Delivered → 5. Invoiced → 6. Paid (File upload enabled on last 3 stages)"
        actions={
          <>
            <div className="inline-flex items-center gap-1 bg-surface-2 border border-bd rounded-ctl p-1">
              <Button
                size="sm"
                variant={viewMode === 'kanban' ? 'primary' : 'ghost'}
                icon={<Kanban size={13} />}
                onClick={() => setViewMode('kanban')}
              >
                Kanban board
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'timeline' ? 'primary' : 'ghost'}
                icon={<Calendar size={13} />}
                onClick={() => setViewMode('timeline')}
              >
                Driver timeline
              </Button>
            </div>

            <Button icon={<Plus size={13} />} onClick={onOpenCreateLoad}>
              Book load
            </Button>
          </>
        }
      />

      {/* Error Alert Box */}
      {errorMessage && (
        <div className="p-3.5 rounded-card bg-danger-bg border border-bd flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <XCircle size={18} className="text-danger shrink-0 mt-0.5" />
            <div className="text-[12.5px]">
              <p className="font-semibold text-fg">Lifecycle guard blocked transition</p>
              <p className="text-fg-2 mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-danger hover:opacity-70 shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* View 1: 6-Stage Kanban Swimlanes */}
      {viewMode === 'kanban' && (
        <div className="overflow-x-auto pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 min-w-[1200px]">
            {columns.map((col) => {
              const colLoads = loads.filter((l) => {
                if (col.status === 'IN_TRANSIT') {
                  return ['AT_PICKUP', 'LOADED', 'IN_TRANSIT', 'AT_DELIVERY'].includes(l.status);
                }
                if (col.status === 'DELIVERED') {
                  return ['DELIVERED', 'DELIVERED_POD'].includes(l.status);
                }
                return l.status === col.status;
              });

              const isDragTarget = dragOverStatus === col.status;

              return (
                <div
                  key={col.status}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverStatus !== col.status) setDragOverStatus(col.status);
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setDragOverStatus(null);
                    }
                  }}
                  onDrop={(e) => handleDrop(e, col.status)}
                  className="flex-1 flex flex-col"
                >
                  <Card
                    padded={false}
                    className={`flex flex-col min-h-[550px] transition-all duration-200 ${
                      isDragTarget ? 'border-accent ring-2 ring-accent/30 bg-accent-weak/15 shadow-hero' : ''
                    }`}
                    header={
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11.5px] font-semibold text-fg truncate pr-1">{col.title}</span>
                        <span className="text-[10.5px] font-semibold tnum text-fg-3 bg-surface-2 border border-bd rounded-full px-2 py-0.5 shrink-0">
                          {colLoads.length}
                        </span>
                      </div>
                    }
                  >
                    <div className="p-2.5 space-y-2.5 flex-1 overflow-y-auto">
                      {colLoads.map((ld) => (
                        <div
                          key={ld.id}
                          draggable={true}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', ld.id);
                            e.dataTransfer.effectAllowed = 'move';
                            setDraggingLoadId(ld.id);
                          }}
                          onDragEnd={() => {
                            setDraggingLoadId(null);
                            setDragOverStatus(null);
                          }}
                          className={`bg-surface-2 border rounded-ctl p-3 transition space-y-2 group cursor-grab active:cursor-grabbing hover:border-accent/50 ${
                            draggingLoadId === ld.id
                              ? 'opacity-40 border-dashed border-accent scale-95 shadow-inner'
                              : 'border-bd'
                          }`}
                        >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            onClick={() => onSelectLoad(ld)}
                            className="font-semibold text-[12px] text-accent tnum hover:underline cursor-pointer"
                          >
                            {ld.loadNumber}
                          </span>
                          <span className="text-[11px] font-semibold text-fg tnum">
                            ${(ld.rateMinor / 100).toLocaleString('en-US')}
                          </span>
                        </div>

                        <p className="text-[11.5px] font-medium text-fg-2 truncate">{ld.brokerName}</p>

                        <div className="text-[10.5px] text-fg-3 bg-surface border border-bd rounded-ctl px-2 py-1.5">
                          <div className="font-medium text-fg-2 truncate">
                            {ld.stops[0]?.city || ld.originCity}, {ld.stops[0]?.state || ld.originState} → {ld.stops[ld.stops.length - 1]?.city || ld.destCity}, {ld.stops[ld.stops.length - 1]?.state || ld.destState}
                          </div>
                          <div className="tnum mt-0.5">
                            {ld.loadedMiles} mi ({ld.deadheadMiles} DH)
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <Badge tone={statusTone(ld.status)}>{humanizeStatus(ld.status)}</Badge>
                          {ld.driverName ? (
                            <span className="inline-flex items-center gap-1.5 min-w-0">
                              <Avatar name={ld.driverName} size={18} />
                              <span className="text-[10.5px] font-medium text-fg-2 truncate">{ld.driverName}</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => onOpenAssignModal(ld)}
                              className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-warn bg-warn-bg px-1.5 py-0.5 rounded-ctl border border-bd"
                            >
                              <AlertTriangle size={11} />
                              <span>Assign</span>
                            </button>
                          )}
                        </div>

                        {/* Attached Documents Chips */}
                        {ld.documents && ld.documents.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {ld.documents.map((doc) => (
                              <span
                                key={doc.id}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-medium bg-accent-weak text-accent truncate max-w-[130px]"
                                title={`${doc.name} (${doc.type})`}
                              >
                                <Paperclip size={9} />
                                <span className="truncate">{doc.name}</span>
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="pt-2 border-t border-bd flex items-center justify-between gap-1 flex-wrap">
                          <button
                            onClick={() => onSelectLoad(ld)}
                            className="text-[10px] text-fg-3 hover:text-fg transition-colors"
                          >
                            Details
                          </button>

                          {/* Upload File Button for Delivered, Invoiced, Paid stages */}
                          {['DELIVERED', 'DELIVERED_POD', 'INVOICED', 'PAID'].includes(ld.status) && (
                            <label className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-ctl text-[10px] font-semibold bg-surface border border-bd text-accent hover:bg-surface-2 cursor-pointer transition">
                              <Upload size={10} />
                              <span>Upload file</span>
                              <input
                                type="file"
                                className="hidden"
                                onChange={(e) => handleFileUpload(ld, e)}
                              />
                            </label>
                          )}

                          {/* Stage Transition Buttons */}
                          {ld.status === 'OPEN' && (
                            <button onClick={() => onOpenAssignModal(ld)} className={stageAction}>
                              <span>Dispatch</span>
                              <ArrowRight size={11} />
                            </button>
                          )}

                          {ld.status === 'DISPATCHED' && (
                            <button onClick={() => handleAdvanceStatus(ld, 'IN_TRANSIT')} className={stageAction}>
                              <span>Transit</span>
                              <ArrowRight size={11} />
                            </button>
                          )}

                          {['AT_PICKUP', 'LOADED', 'IN_TRANSIT', 'AT_DELIVERY'].includes(ld.status) && (
                            <button onClick={() => handleAdvanceStatus(ld, 'DELIVERED')} className={stageAction}>
                              <span>Delivered</span>
                              <CheckCircle2 size={11} />
                            </button>
                          )}

                          {['DELIVERED', 'DELIVERED_POD'].includes(ld.status) && (
                            <button onClick={() => handleAdvanceStatus(ld, 'INVOICED')} className={stageAction}>
                              <span>Invoice</span>
                              <FileText size={11} />
                            </button>
                          )}

                          {ld.status === 'INVOICED' && (
                            <button onClick={() => handleAdvanceStatus(ld, 'PAID')} className={stageAction}>
                              <span>Paid</span>
                              <DollarSign size={11} />
                            </button>
                          )}

                          {ld.status === 'PAID' && (
                            <span className="text-pos font-semibold text-[10px] inline-flex items-center gap-1">
                              <CheckCircle2 size={11} />
                              <span>Closed</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    {colLoads.length === 0 && (
                      <div className="p-3 text-center text-fg-3 text-[10.5px] italic border border-dashed border-bd rounded-ctl">
                        Empty
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* View 2: Driver Timeline */}
      {viewMode === 'timeline' && (
        <Card
          header={
            <h3 className="text-[13.5px] font-semibold text-fg inline-flex items-center gap-2">
              <Truck size={15} className="text-accent" />
              <span>Driver roster & equipment schedule timeline</span>
            </h3>
          }
        >
          <div className="space-y-3">
            {drivers.map((drv) => {
              const driverLoads = loads.filter((l) => l.driverId === drv.id);

              return (
                <div key={drv.id} className="p-3.5 rounded-ctl bg-surface-2 border border-bd space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={drv.name} size={32} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-fg text-[12.5px] truncate">{drv.name}</span>
                          <Badge tone="neutral">{drv.employmentType}</Badge>
                        </div>
                        <p className="text-[11px] text-fg-3 mt-0.5">
                          Truck: <span className="text-accent font-semibold tnum">{drv.assignedTruckNumber || 'None'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10.5px] text-fg-3 font-semibold">Assigned loads</span>
                      <p className="font-semibold text-[13px] text-fg tnum">{driverLoads.length} active</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2.5 border-t border-bd">
                    {driverLoads.map((l) => (
                      <div
                        key={l.id}
                        onClick={() => onSelectLoad(l)}
                        className="p-2.5 rounded-ctl bg-surface border border-bd hover:border-accent/50 transition cursor-pointer flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <span className="font-semibold text-accent text-[11.5px] tnum">{l.loadNumber}</span>
                          <p className="text-[10.5px] text-fg-3 truncate">
                            {l.stops[0]?.city || l.originCity} → {l.stops[l.stops.length - 1]?.city || l.destCity}
                          </p>
                        </div>
                        <Badge tone={statusTone(l.status)}>{humanizeStatus(l.status)}</Badge>
                      </div>
                    ))}
                    {driverLoads.length === 0 && (
                      <span className="text-fg-3 italic text-[11px]">No loads assigned.</span>
                    )}
                  </div>
                </div>
              );
            })}

            {drivers.length === 0 && (
              <EmptyState
                icon={<Truck size={28} strokeWidth={1.5} />}
                title="No drivers on the roster"
              />
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
