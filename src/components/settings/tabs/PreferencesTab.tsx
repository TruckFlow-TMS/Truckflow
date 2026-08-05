import React, { useState } from 'react';
import { Card, Input, Button, Badge } from '../../ui';
import { useToast } from '../../ui/Toast';
import {
  Building, Save, CreditCard, FileCheck, Upload, Trash2, Eye,
  AlertTriangle, CheckCircle2, ShieldCheck, FileText, Calendar, Paperclip, Check
} from 'lucide-react';

interface CompanyDoc {
  id: string;
  key: string;
  title: string;
  required: boolean;
  fileName?: string;
  fileUrl?: string;
  uploadedAt?: string;
  expirationDate?: string;
}

const DEFAULT_DOCS: CompanyDoc[] = [
  // Required (1-8)
  { id: 'cd-1', key: 'mc_authority', title: '1. MC Authority', required: true, fileName: 'MC_Authority_Certificate.pdf', uploadedAt: '2026-01-15T10:00:00Z' },
  { id: 'cd-2', key: 'registration', title: '2. Registration', required: true, fileName: 'State_Registration_2026.pdf', uploadedAt: '2026-01-15T10:05:00Z', expirationDate: '2026-12-31' },
  { id: 'cd-3', key: 'ein_reg', title: '3. EIN Registration', required: true, fileName: 'IRS_EIN_Letter.pdf', uploadedAt: '2026-01-15T10:10:00Z' },
  { id: 'cd-4', key: 'insurance', title: '4. Company Insurance', required: true, fileName: 'Certificate_Of_Insurance.pdf', uploadedAt: '2026-02-01T09:00:00Z', expirationDate: '2026-11-15' },
  { id: 'cd-5', key: 'mcs_90', title: '5. MCS-90 Form', required: true, fileName: 'MCS90_Endorsement.pdf', uploadedAt: '2026-02-01T09:15:00Z' },
  { id: 'cd-6', key: 'drug_alcohol', title: '6. Drug & Alcohol Policy Document', required: true, fileName: 'Drug_Alcohol_Policy_Signed.pdf', uploadedAt: '2026-01-20T14:30:00Z' },
  { id: 'cd-7', key: 'ucr', title: '7. UCR', required: true, fileName: 'UCR_2026_Receipt.pdf', uploadedAt: '2026-01-05T11:20:00Z', expirationDate: '2026-12-31' },
  { id: 'cd-8', key: 'ifta', title: '8. IFTA License', required: true, fileName: 'IFTA_License_2026.pdf', uploadedAt: '2026-01-10T16:00:00Z', expirationDate: '2026-12-31' },
  // Optional (9-12)
  { id: 'cd-9', key: 'kyu', title: '9. KYU Permit', required: false },
  { id: 'cd-10', key: 'ny_hut', title: '10. NY HUT', required: false },
  { id: 'cd-11', key: 'idaho', title: '11. IDAHO Permit', required: false },
  { id: 'cd-12', key: 'new_mexico', title: '12. New Mexico Permit', required: false },
];

export const PreferencesTab: React.FC = () => {
  const { showToast } = useToast();

  // Company Information State
  const [companyName, setCompanyName] = useState('Nune HQ LLC');
  const [mcNumber, setMcNumber] = useState('MC-1094829');
  const [dotNumber, setDotNumber] = useState('USDOT-3849201');
  const [adminEmail, setAdminEmail] = useState('admin@nuneexpress.com');
  const [phone, setPhone] = useState('(800) 555-0199');
  const [factoringPartner, setFactoringPartner] = useState('RTS Financial (Recourse Factoring)');
  const [factoringRate, setFactoringRate] = useState('2.0');
  const [isSaving, setIsSaving] = useState(false);

  // Legal Documents State
  const [docs, setDocs] = useState<CompanyDoc[]>(DEFAULT_DOCS);

  const requiredDocs = docs.filter(d => d.required);
  const optionalDocs = docs.filter(d => !d.required);
  const uploadedRequiredCount = requiredDocs.filter(d => d.fileName).length;
  const isFullyCompliant = uploadedRequiredCount === requiredDocs.length;

  const handleFileUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocs(prev => prev.map(d => {
      if (d.id === id) {
        return {
          ...d,
          fileName: file.name,
          fileUrl: URL.createObjectURL(file),
          uploadedAt: new Date().toISOString(),
        };
      }
      return d;
    }));

    const targetDoc = docs.find(d => d.id === id);
    showToast('success', `Uploaded ${file.name} for ${targetDoc?.title}`);
  };

  const handleRemoveDoc = (id: string) => {
    const targetDoc = docs.find(d => d.id === id);
    setDocs(prev => prev.map(d => {
      if (d.id === id) {
        return {
          ...d,
          fileName: undefined,
          fileUrl: undefined,
          uploadedAt: undefined,
          expirationDate: undefined,
        };
      }
      return d;
    }));
    showToast('info', `Removed document for ${targetDoc?.title}`);
  };

  const handleExpirationChange = (id: string, expDate: string) => {
    setDocs(prev => prev.map(d => (d.id === id ? { ...d, expirationDate: expDate } : d)));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFullyCompliant) {
      showToast('error', 'Please upload all mandatory legal compliance documents marked with *');
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      showToast('success', 'Company profile and legal compliance documents saved successfully!');
    }, 400);
  };

  return (
    <div className="space-y-4">
      {/* Overview & Compliance Status Banner */}
      <div className={`p-4 rounded-card border transition-all ${
        isFullyCompliant
          ? 'bg-pos-bg/40 border-pos/30 text-fg'
          : 'bg-warn-bg/40 border-warn/30 text-fg'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
              isFullyCompliant ? 'bg-pos text-white' : 'bg-warn text-white'
            }`}>
              {isFullyCompliant ? <ShieldCheck size={20} /> : <AlertTriangle size={20} />}
            </span>
            <div>
              <h3 className="text-[13.5px] font-bold">
                {isFullyCompliant ? 'Legal & Regulatory Compliance Status: Active' : 'Legal Compliance Action Required'}
              </h3>
              <p className="text-[11.5px] text-fg-2 mt-0.5">
                {uploadedRequiredCount} of {requiredDocs.length} required company documents uploaded ({Math.round((uploadedRequiredCount / requiredDocs.length) * 100)}% Complete)
              </p>
            </div>
          </div>

          <Badge tone={isFullyCompliant ? 'pos' : 'warn'}>
            {isFullyCompliant ? '100% Compliant' : `${requiredDocs.length - uploadedRequiredCount} Missing Required`}
          </Badge>
        </div>
      </div>

      {/* Main Company Profile Form */}
      <Card
        header={
          <div className="flex items-center gap-2">
            <Building size={18} className="text-accent" />
            <h2 className="text-[14.5px] font-semibold text-fg">Company profile &amp; legal identity</h2>
          </div>
        }
      >
        <form onSubmit={handleSave} className="space-y-6 text-[12.5px] text-fg-2">
          {/* Section 1: Basic Company Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Company legal name *"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
            <Input
              label="MC Number *"
              required
              value={mcNumber}
              onChange={(e) => setMcNumber(e.target.value)}
              className="tnum"
            />
            <Input
              label="USDOT Number *"
              required
              value={dotNumber}
              onChange={(e) => setDotNumber(e.target.value)}
              className="tnum"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Primary admin email *"
              type="email"
              required
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
            />
            <Input
              label="Primary phone number *"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="tnum"
            />
          </div>

          {/* Section 2: Factoring */}
          <div className="pt-3 border-t border-bd space-y-3">
            <h3 className="font-semibold text-fg text-[11.5px] uppercase tracking-wide inline-flex items-center gap-1.5">
              <CreditCard size={14} className="text-accent" />
              <span>Factoring partner integration</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Factoring partner name"
                value={factoringPartner}
                onChange={(e) => setFactoringPartner(e.target.value)}
              />
              <Input
                label="Factoring fee rate (%)"
                type="number"
                step="0.1"
                value={factoringRate}
                onChange={(e) => setFactoringRate(e.target.value)}
                className="tnum"
              />
            </div>
          </div>

          {/* Section 3: Legal & Regulatory Document Uploads */}
          <div className="pt-4 border-t border-bd space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-fg text-[13px] inline-flex items-center gap-1.5">
                  <FileCheck size={16} className="text-accent" />
                  <span>Company Legal &amp; Regulatory Documents</span>
                </h3>
                <p className="text-[11.5px] text-fg-3 mt-0.5">
                  Upload official certificates, policies, permits, and state licenses (8 Required, 4 Optional).
                </p>
              </div>
            </div>

            {/* Subsection A: Required Legal Documents (1-8) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-fg uppercase tracking-wider">
                  Mandatory Compliance Documents (1 – 8)
                </span>
                <span className="text-[10px] font-bold text-danger bg-danger-bg px-1.5 py-0.5 rounded">Required *</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {requiredDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className={`p-3 rounded-ctl border transition-all space-y-2.5 ${
                      doc.fileName
                        ? 'bg-surface border-bd hover:border-accent/50'
                        : 'bg-warn-bg/20 border-warn/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-semibold text-fg text-[12.5px] truncate flex items-center gap-1.5">
                          {doc.title}
                          <span className="text-danger font-bold">*</span>
                        </span>
                      </div>
                      <Badge tone={doc.fileName ? 'pos' : 'warn'} dot={false}>
                        {doc.fileName ? '✓ Uploaded' : 'Missing *'}
                      </Badge>
                    </div>

                    {doc.fileName ? (
                      <div className="space-y-2 pt-1 border-t border-bd/60">
                        <div className="flex items-center justify-between text-[11.5px]">
                          <span className="inline-flex items-center gap-1.5 text-accent font-medium truncate max-w-[220px]">
                            <Paperclip size={12} />
                            <span className="truncate">{doc.fileName}</span>
                          </span>

                          <div className="flex items-center gap-1">
                            {doc.fileUrl && (
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded text-fg-3 hover:text-accent hover:bg-surface-2 transition-colors"
                                title="View document"
                              >
                                <Eye size={14} />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveDoc(doc.id)}
                              className="p-1 rounded text-fg-3 hover:text-danger hover:bg-surface-2 transition-colors"
                              title="Remove file"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Input
                            type="date"
                            label="Expiration date (if applicable)"
                            value={doc.expirationDate || ''}
                            onChange={(e) => handleExpirationChange(doc.id, e.target.value)}
                            className="h-7 text-[11px] tnum"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="pt-1">
                        <label className="inline-flex items-center justify-center gap-1.5 w-full px-3 py-1.5 rounded-ctl border border-dashed border-bd-strong bg-surface hover:bg-surface-2 cursor-pointer text-[11.5px] font-medium text-fg-2 hover:text-accent transition">
                          <Upload size={13} className="text-accent" />
                          <span>Choose file to upload…</span>
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => handleFileUpload(doc.id, e)}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Subsection B: Optional State Permits & Licenses (9-12) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-fg uppercase tracking-wider">
                  State Permits &amp; Optional Licenses (9 – 12)
                </span>
                <span className="text-[10px] font-medium text-fg-3 bg-surface-2 px-1.5 py-0.5 rounded border border-bd">Optional</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {optionalDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 rounded-ctl border border-bd bg-surface hover:border-accent/40 transition-all space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-fg text-[12.5px] truncate">{doc.title}</span>
                      <Badge tone={doc.fileName ? 'pos' : 'neutral'} dot={false}>
                        {doc.fileName ? '✓ Uploaded' : 'Optional'}
                      </Badge>
                    </div>

                    {doc.fileName ? (
                      <div className="space-y-2 pt-1 border-t border-bd/60">
                        <div className="flex items-center justify-between text-[11.5px]">
                          <span className="inline-flex items-center gap-1.5 text-accent font-medium truncate max-w-[220px]">
                            <Paperclip size={12} />
                            <span className="truncate">{doc.fileName}</span>
                          </span>

                          <div className="flex items-center gap-1">
                            {doc.fileUrl && (
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded text-fg-3 hover:text-accent hover:bg-surface-2 transition-colors"
                                title="View document"
                              >
                                <Eye size={14} />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveDoc(doc.id)}
                              className="p-1 rounded text-fg-3 hover:text-danger hover:bg-surface-2 transition-colors"
                              title="Remove file"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <Input
                          type="date"
                          label="Expiration date"
                          value={doc.expirationDate || ''}
                          onChange={(e) => handleExpirationChange(doc.id, e.target.value)}
                          className="h-7 text-[11px] tnum"
                        />
                      </div>
                    ) : (
                      <div className="pt-1">
                        <label className="inline-flex items-center justify-center gap-1.5 w-full px-3 py-1.5 rounded-ctl border border-dashed border-bd bg-surface hover:bg-surface-2 cursor-pointer text-[11.5px] font-medium text-fg-3 hover:text-accent transition">
                          <Upload size={13} className="text-fg-3" />
                          <span>Upload optional permit…</span>
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => handleFileUpload(doc.id, e)}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-bd">
            <span className="text-[11.5px] text-fg-3 italic">
              * All required documents must be uploaded before saving legal compliance profile.
            </span>
            <Button type="submit" icon={<Save size={14} />} loading={isSaving}>
              {isSaving ? 'Saving preferences…' : 'Save Company Profile & Legal Docs'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
