import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export function ConfirmModal({ title, message, confirmLabel = 'Confirm', onConfirm, onCancel, danger }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-lg p-6 max-w-[420px] w-full mx-4 shadow-xl">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle size={20} className={danger ? 'text-[#A32D2D]' : 'text-[#854F0B]'} />
          <div>
            <h3 className="text-[14px] font-bold text-[#1A1A2E]">{title}</h3>
            <p className="text-xs text-[#5A6A7A] mt-1">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
          <button onClick={onConfirm} className={danger ? 'btn-danger' : 'btn-primary'}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
