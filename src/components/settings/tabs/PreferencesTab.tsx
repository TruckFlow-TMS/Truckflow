import React from 'react';
import { Card } from '../../ui';
import { Building } from 'lucide-react';

export const PreferencesTab: React.FC = () => {
  return (
    <Card
      header={
        <div className="flex items-center gap-2">
          <Building size={18} className="text-accent" />
          <h2 className="text-[14.5px] font-semibold text-fg">Company profile &amp; operations settings</h2>
        </div>
      }
    >
      <div className="space-y-6 text-[12.5px] text-fg-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-surface-2 p-4 rounded-ctl border border-bd">
          <div>
            <span className="text-[10.5px] text-fg-3 uppercase font-semibold tracking-wide">Company legal name</span>
            <p className="font-semibold text-fg text-[13.5px] mt-0.5">Nune Express LLC</p>
          </div>
          <div>
            <span className="text-[10.5px] text-fg-3 uppercase font-semibold tracking-wide">Tenant identification ID</span>
            <p className="font-semibold text-accent tnum text-[12.5px] mt-0.5">tenant-nune-express</p>
          </div>
          <div>
            <span className="text-[10.5px] text-fg-3 uppercase font-semibold tracking-wide">Primary admin email</span>
            <p className="text-fg-2 text-[12.5px] mt-0.5 tnum">admin@nuneexpress.com</p>
          </div>
        </div>

        <div className="pt-2 border-t border-bd space-y-3">
          <h3 className="font-semibold text-fg text-[11.5px] uppercase tracking-wide">Factoring partner integration</h3>
          <div className="p-4 rounded-ctl bg-surface-2 border border-bd space-y-1">
            <p className="text-fg font-medium">
              Partner: <span className="text-pos">RTS Financial (Recourse Factoring)</span>
            </p>
            <p className="text-fg-3">Factoring rate: 2.0% &bull; Reserve holdback: 3.0%</p>
          </div>
        </div>
      </div>
    </Card>
  );
};
