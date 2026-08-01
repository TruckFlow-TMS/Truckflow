import React, { useState } from 'react';
import { Card, Input, Button } from '../../ui';
import { useToast } from '../../ui/Toast';
import { Building, Save, ShieldCheck, CreditCard } from 'lucide-react';

export const PreferencesTab: React.FC = () => {
  const { showToast } = useToast();
  const [companyName, setCompanyName] = useState('Nune Express LLC');
  const [mcNumber, setMcNumber] = useState('MC-1094829');
  const [dotNumber, setDotNumber] = useState('USDOT-3849201');
  const [adminEmail, setAdminEmail] = useState('admin@nuneexpress.com');
  const [phone, setPhone] = useState('(800) 555-0199');
  const [factoringPartner, setFactoringPartner] = useState('RTS Financial (Recourse Factoring)');
  const [factoringRate, setFactoringRate] = useState('2.0');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      showToast('success', 'Company profile preferences saved successfully');
    }, 400);
  };

  return (
    <Card
      header={
        <div className="flex items-center gap-2">
          <Building size={18} className="text-accent" />
          <h2 className="text-[14.5px] font-semibold text-fg">Company profile &amp; operations settings</h2>
        </div>
      }
    >
      <form onSubmit={handleSave} className="space-y-6 text-[12.5px] text-fg-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Company legal name"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
          <Input
            label="MC Number"
            value={mcNumber}
            onChange={(e) => setMcNumber(e.target.value)}
            className="tnum"
          />
          <Input
            label="USDOT Number"
            value={dotNumber}
            onChange={(e) => setDotNumber(e.target.value)}
            className="tnum"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Primary admin email"
            type="email"
            required
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
          />
          <Input
            label="Primary phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="tnum"
          />
        </div>

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

        <div className="flex justify-end pt-3 border-t border-bd">
          <Button type="submit" icon={<Save size={14} />} loading={isSaving}>
            {isSaving ? 'Saving preferences…' : 'Save Company Profile'}
          </Button>
        </div>
      </form>
    </Card>
  );
};
