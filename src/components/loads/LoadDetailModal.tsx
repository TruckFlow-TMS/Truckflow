import React, { useState } from 'react';
import { Load } from '../../types/tms';
import { mockStore } from '../../services/mockStore';
import { useAuth } from '../../context/AuthContext';
import { Upload, CheckCircle } from 'lucide-react';
import { Modal, Card, Badge, Button, Input, Select, statusTone, humanizeStatus } from '../ui';
import { cn } from '../../lib/cn';

interface LoadDetailModalProps {
  load: Load | null;
  onClose: () => void;
  onReload: () => void;
}

const TABS = [
  { id: 'OVERVIEW', label: 'Overview' },
  { id: 'STOPS', label: 'Stops & route' },
  { id: 'DOCUMENTS', label: 'Documents & rate cons' },
  { id: 'FINANCIALS', label: 'Financial breakdown' },
  { id: 'ACTIVITY', label: 'Audit trail' },
] as const;

export const LoadDetailModal: React.FC<LoadDetailModalProps> = ({ load, onClose, onReload }) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'STOPS' | 'DOCUMENTS' | 'FINANCIALS' | 'ACTIVITY'>('OVERVIEW');
  const [docType, setDocType] = useState('BOL');
  const [docName, setDocName] = useState('');
  const [fileObj, setFileObj] = useState<File | null>(null);
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
    const fileUrl = fileObj ? URL.createObjectURL(fileObj) : '#';
    await mockStore.uploadDocument(
      load.id,
      {
        type: docType as any,
        name: docName || fileObj?.name || 'Document',
        version: 1,
        uploadedBy: currentUser.name,
        fileUrl,
      },
      currentUser
    );
    setDocName('');
    setFileObj(null);
    onReload();
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Load ${load.loadNumber}`}
      subtitle={`${load.originCity}, ${load.originState} → ${load.destCity}, ${load.destState}`}
      size="lg"
    >
      <div className="flex items-center gap-3 mb-4">
        <Badge tone={statusTone(load.status)}>{humanizeStatus(load.status)}</Badge>
      </div>

      <div className="flex gap-5 border-b border-bd mb-5 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'py-2.5 text-[12.5px] font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors',
              activeTab === tab.id ? 'border-accent text-accent' : 'border-transparent text-fg-3 hover:text-fg',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'OVERVIEW' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <h3 className="text-[11px] font-semibold text-fg-3 uppercase tracking-wide mb-3">Broker & customer details</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3.5">
                <div>
                  <p className="text-[11px] text-fg-3">Broker</p>
                  <p className="text-[13.5px] text-fg font-medium mt-0.5">{load.brokerName}</p>
                </div>
                <div>
                  <p className="text-[11px] text-fg-3">Broker ref #</p>
                  <p className="text-[13.5px] text-accent font-medium mt-0.5 tnum">{load.brokerReference}</p>
                </div>
                <div>
                  <p className="text-[11px] text-fg-3">Gross rate</p>
                  <p className="text-[13.5px] text-pos font-medium mt-0.5 tnum">${(load.rateMinor / 100).toFixed(2)}</p>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="text-[11px] font-semibold text-fg-3 uppercase tracking-wide mb-3">Driver & equipment assignment</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3.5">
                <div>
                  <p className="text-[11px] text-fg-3">Driver</p>
                  <p className="text-[13.5px] text-fg font-medium mt-0.5">{load.driverName || 'Unassigned'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-fg-3">Truck unit #</p>
                  <p className="text-[13.5px] text-fg font-medium mt-0.5 tnum">{load.truckNumber || 'Unassigned'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-fg-3">Trailer #</p>
                  <p className="text-[13.5px] text-fg font-medium mt-0.5 tnum">{load.trailerNumber || 'Unassigned'}</p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-[13.5px] font-semibold text-fg">Status workflow advancement</h3>
              <p className="text-[12px] text-fg-2 mt-0.5">
                Current active status is <span className="font-semibold text-accent">{humanizeStatus(load.status)}</span>
              </p>
            </div>
            {load.status !== 'PAID' && load.status !== 'CANCELLED' && (
              <Button icon={<CheckCircle size={14} />} loading={isAdvancing} onClick={handleAdvanceStatus}>
                {isAdvancing ? 'Updating…' : 'Advance next status'}
              </Button>
            )}
          </Card>

          {load.notes && (
            <Card>
              <h4 className="text-[11px] font-semibold text-fg-3 uppercase tracking-wide mb-1.5">Internal notes</h4>
              <p className="text-[13px] text-fg-2">{load.notes}</p>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'STOPS' && (
        <div className="space-y-3">
          <h3 className="text-[11px] font-semibold text-fg-3 uppercase tracking-wide">Route stops & appointments</h3>
          {load.stops && load.stops.length > 0 ? load.stops.map(stop => (
            <Card key={stop.id}>
              <Badge tone="accent" className="mb-2">{stop.type} — Stop #{stop.sequence}</Badge>
              <p className="text-[13.5px] text-fg font-medium">{stop.facilityName || 'Facility'}</p>
              <p className="text-[12px] text-fg-2 mt-0.5">{stop.address}, {stop.city}, {stop.state} {stop.zip}</p>
            </Card>
          )) : (
            <p className="text-[13px] text-fg-3 italic">No custom stops configured.</p>
          )}
        </div>
      )}

      {activeTab === 'DOCUMENTS' && (
        <div className="space-y-5">
          <Card>
            <form onSubmit={handleUploadDoc} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Select
                  label="Document type"
                  value={docType}
                  onChange={e => setDocType(e.target.value)}
                  options={[
                    { value: 'BOL', label: 'Bill of Lading (BOL)' },
                    { value: 'POD', label: 'Proof of Delivery (POD)' },
                    { value: 'RATE_CON', label: 'Rate Confirmation' },
                    { value: 'INVOICE_PDF', label: 'Invoice PDF' },
                    { value: 'RECEIPT', label: 'Expense Receipt' },
                    { value: 'WEIGHT_TICKET', label: 'Weight Ticket' },
                  ]}
                />
                <Input
                  label="File description / Name"
                  required
                  value={docName}
                  onChange={e => setDocName(e.target.value)}
                  placeholder="e.g. Signed BOL - Chicago facility"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <label className="flex items-center gap-2 px-3 py-1.5 rounded-ctl border border-bd bg-surface-2 hover:bg-surface text-[12px] font-medium cursor-pointer text-fg transition">
                  <Upload size={14} className="text-accent" />
                  <span>Choose file from device…</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (!docName) setDocName(file.name);
                        setFileObj(file);
                      }
                    }}
                  />
                </label>
                {fileObj && (
                  <span className="text-[12px] text-pos font-semibold truncate">
                    Selected: {fileObj.name}
                  </span>
                )}
                <Button type="submit" icon={<Upload size={14} />}>Upload document</Button>
              </div>
            </form>
          </Card>

          <div className="space-y-2">
            {load.documents && load.documents.length > 0 ? load.documents.map(doc => (
              <Card key={doc.id} className="flex justify-between items-center">
                <div>
                  <p className="text-[13.5px] text-fg font-medium">{doc.name}</p>
                  <p className="text-[11px] text-fg-3 mt-0.5">{doc.type} • Uploaded by {doc.uploadedBy} on {new Date(doc.uploadedAt).toLocaleString()}</p>
                </div>
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[12.5px] font-semibold text-accent hover:underline"
                >
                  View document
                </a>
              </Card>
            )) : <p className="text-[13px] text-fg-3 italic">No documents attached yet.</p>}
          </div>
        </div>
      )}

      {activeTab === 'FINANCIALS' && (
        <div className="space-y-3">
          <Card className="flex justify-between items-center">
            <span className="text-[13px] text-fg-2 font-medium">Agreed base gross rate</span>
            <span className="text-[16px] font-semibold text-pos tnum">${(load.rateMinor / 100).toFixed(2)}</span>
          </Card>
          <Card>
            <h3 className="text-[11px] font-semibold text-fg-3 uppercase tracking-wide mb-2">Accessorials & fuel surcharge</h3>
            {load.accessorials && load.accessorials.length > 0 ? load.accessorials.map(acc => (
              <div key={acc.id} className="flex justify-between items-center border-b border-bd py-2 text-[13px] last:border-b-0">
                <span className="text-fg-2">{acc.type} - {acc.description}</span>
                <span className="text-pos tnum">${(acc.billableAmountMinor / 100).toFixed(2)}</span>
              </div>
            )) : <p className="text-[13px] text-fg-3 italic">No extra accessorials attached.</p>}
          </Card>
        </div>
      )}

      {activeTab === 'ACTIVITY' && (
        <Card className="text-center text-[13px] text-fg-3 italic py-6">
          Audit log activity stream for Load #{load.loadNumber}.
        </Card>
      )}
    </Modal>
  );
};
