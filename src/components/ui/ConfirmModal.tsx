import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen, title, message, isDanger = false, onConfirm, onCancel, isLoading = false,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onCancel}
    title={title}
    size="sm"
    busy={isLoading}
    footer={
      <>
        <Button variant="secondary" onClick={onCancel} disabled={isLoading}>Cancel</Button>
        <Button variant={isDanger ? 'danger' : 'primary'} onClick={onConfirm} loading={isLoading}>
          Confirm
        </Button>
      </>
    }
  >
    <div className="flex items-start gap-3">
      {isDanger && (
        <span className="w-9 h-9 rounded-full bg-danger-bg text-danger flex items-center justify-center shrink-0">
          <AlertTriangle size={17} />
        </span>
      )}
      <p className="text-[13px] text-fg-2 leading-relaxed">{message}</p>
    </div>
  </Modal>
);
