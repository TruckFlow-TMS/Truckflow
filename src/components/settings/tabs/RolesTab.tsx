import React from 'react';
import { Role } from '../../../types/tms';
import { Card, Badge, EmptyState } from '../../ui';
import { ShieldCheck, Lock } from 'lucide-react';

interface RolesTabProps {
  roles: Role[];
  onReload: () => void;
}

export const RolesTab: React.FC<RolesTabProps> = ({ roles }) => {
  return (
    <div className="space-y-3.5">
      <p className="text-[13.5px] text-fg-2">
        System and custom roles available to this workspace, with their granted permission count.
      </p>

      {roles.length === 0 ? (
        <EmptyState
          icon={<Lock size={30} strokeWidth={1.5} />}
          title="No roles configured"
          sub="Roles are seeded automatically for new workspaces."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {roles.map((role) => (
            <Card key={role.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-fg text-[13.5px]">{role.name}</span>
                    {role.isSystemOwner && <Badge tone="violet" dot={false}>Owner</Badge>}
                  </div>
                  <p className="text-[12px] text-fg-2 mt-1">
                    {role.description || 'No description provided.'}
                  </p>
                </div>
                <span className="w-9 h-9 rounded-ctl bg-accent-weak text-accent flex items-center justify-center shrink-0">
                  <ShieldCheck size={17} />
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-bd text-[11.5px] text-fg-3 tnum">
                {role.permissions.length} permission{role.permissions.length === 1 ? '' : 's'} granted
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
