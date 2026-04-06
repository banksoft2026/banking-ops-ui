import { useUIStore } from '../../store/uiStore';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: 'bg-white border-[#0F6E56] text-[#0F6E56]',
  error: 'bg-white border-[#A32D2D] text-[#A32D2D]',
  warning: 'bg-white border-[#854F0B] text-[#854F0B]',
  info: 'bg-white border-[#185FA5] text-[#185FA5]',
};

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => {
        const Icon = icons[toast.type];
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-3 rounded-lg border-l-4 shadow-lg min-w-[280px] max-w-sm ${colors[toast.type]}`}
          >
            <Icon size={15} className="shrink-0 mt-0.5" />
            <span className="text-xs text-[#1A1A2E] flex-1">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="text-[#8A9BAB] hover:text-[#1A1A2E]">
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
