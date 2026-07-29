import React from 'react';
import { Broker } from '../../types/tms';
import { Building2, Star, ShieldCheck, DollarSign } from 'lucide-react';

interface BrokersViewProps {
  brokers: Broker[];
}

export const BrokersView: React.FC<BrokersViewProps> = ({ brokers }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <span>Broker Partners & Customer Accounts</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            MC credit limits, payment terms, historical average days-to-pay, & broker ratings.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {brokers.map((brk) => (
          <div key={brk.id} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-extrabold text-white">{brk.name}</h3>
                <p className="text-xs font-mono text-blue-400">{brk.mcNumber}</p>
              </div>

              <div className="flex items-center space-x-1 bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-lg border border-amber-500/20 font-bold text-xs">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{(brk.rating || 5).toFixed(1)}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold">Credit Limit</span>
                <p className="font-mono font-bold text-emerald-400">
                  ${(brk.creditLimitMinor / 100).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold">Pay Terms</span>
                <p className="font-mono font-bold text-slate-200">{brk.paymentTermsDays} Days</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold">Avg Days to Pay</span>
                <p className="font-mono font-bold text-blue-400">{brk.averageDaysToPay} Days</p>
              </div>
            </div>

            <div className="text-xs text-slate-400 space-y-1">
              <p>Email: <span className="text-slate-200">{brk.contactEmail}</span></p>
              <p>Dispatch Line: <span className="text-slate-200 font-mono">{brk.contactPhone}</span></p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
