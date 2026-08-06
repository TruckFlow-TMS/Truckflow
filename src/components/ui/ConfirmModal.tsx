import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  isDanger?: boolean;
  /**
   * When set, the action stays locked until the operator types this exactly —
   * the record's own name. Reserve it for writes that cannot be undone.
   */
  confirmPhrase?: string;
  /** What the phrase refers to, e.g. "load number". Shown in the hint. */
  confirmNoun?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen, title, message, isDanger = false,
  confirmPhrase, confirmNoun = 'name', confirmLabel = 'Confirm',
  onConfirm, onCancel, isLoading = false,
}) => {
  const [typed, setTyped] = useState('');

  // Reopening for a different record must not inherit the previous entry.
  useEffect(() => { setTyped(''); }, [isOpen, confirmPhrase]);

  const normalise = (s: string) => s.trim().toLowerCase();
  const matches = !confirmPhrase || normalise(typed) === normalise(confirmPhrase);
  const canConfirm = matches && !isLoading;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      size="sm"
      busy={isLoading}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={isLoading}>Cancel</Button>
          <Button
            variant={isDanger ? 'danger' : 'primary'}
            onClick={onConfirm}
            disabled={!canConfirm}
            loading={isLoading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        <div className="flex items-start gap-3">
          {isDanger && (
            <span className="w-9 h-9 rounded-full bg-danger-bg text-danger flex items-center justify-center shrink-0">
              <AlertTriangle size={17} />
            </span>
          )}
          <p className="text-[13px] text-fg-2 leading-relaxed">{message}</p>
        </div>

        {confirmPhrase && (
          <div className="space-y-1.5 pt-1 border-t border-bd">
            <p className="text-[12px] text-fg-2 leading-relaxed">
              Type the {confirmNoun}{' '}
              <span className="font-semibold text-fg tnum select-all">{confirmPhrase}</span>{' '}
              to confirm.
            </p>
            <Input
              aria-label={`Type ${confirmPhrase} to confirm`}
              placeholder={confirmPhrase}
              autoFocus
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canConfirm) { e.preventDefault(); onConfirm(); }
              }}
            />
            {typed.length > 0 && !matches && (
              <p className="text-[11px] text-warn font-medium">
                Does not match yet.
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
