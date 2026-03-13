import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X, Trash2 } from 'lucide-react';

// ─── Toast Notification ───────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

const ICONS = {
  success: CheckCircle2,
  error:   AlertTriangle,
  warning: AlertTriangle,
  info:    Info,
};

const COLORS = {
  success: { bg: '#30D15812', border: '#30D15830', icon: '#30D158', text: '#30D158' },
  error:   { bg: '#FF453A12', border: '#FF453A30', icon: '#FF453A', text: '#FF453A' },
  warning: { bg: '#FF9F0A12', border: '#FF9F0A30', icon: '#FF9F0A', text: '#FF9F0A' },
  info:    { bg: '#0A84FF12', border: '#0A84FF30', icon: '#0A84FF', text: '#0A84FF' },
};

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-[500] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: '360px', width: 'calc(100vw - 32px)' }}>
      {toasts.map(toast => {
        const Icon = ICONS[toast.type];
        const col  = COLORS[toast.type];
        return (
          <div
            key={toast.id}
            className="rounded-[18px] px-4 py-3.5 flex items-start gap-3 pointer-events-auto animate-scale backdrop-blur-md"
            style={{
              background: col.bg,
              border: `1px solid ${col.border}`,
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            }}
          >
            <Icon className="w-5 h-5 shrink-0 mt-0.5" style={{ color: col.icon }} />
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold" style={{ color: col.text }}>{toast.title}</p>
              {toast.message && <p className="text-[12px] mt-0.5 opacity-80" style={{ color: col.text }}>{toast.message}</p>}
            </div>
            <button onClick={() => onRemove(toast.id)} className="shrink-0 p-1 rounded-full opacity-60 hover:opacity-100 transition-opacity" style={{ color: col.text }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

// Auto-remove hook
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const add = (type: ToastType, title: string, message?: string, duration = 3500) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, title, message, duration }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  };

  const remove = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  return {
    toasts,
    remove,
    success: (title: string, message?: string) => add('success', title, message),
    error:   (title: string, message?: string) => add('error',   title, message),
    warning: (title: string, message?: string) => add('warning', title, message),
    info:    (title: string, message?: string) => add('info',    title, message),
  };
};

// ─── Confirm Dialog ───────────────────────────────────────────────
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  darkMode?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open, title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar',
  danger = false, onConfirm, onCancel, darkMode = false,
}) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onConfirm();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  const cardBg  = darkMode ? '#1C1C1E' : '#FFFFFF';
  const text    = darkMode ? '#F5F5F7' : '#1D1D1F';
  const textSec = darkMode ? '#8E8E93' : '#6E6E73';
  const surfBg  = darkMode ? '#2C2C2E' : '#F5F5F7';

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[400] animate-fade" onClick={onCancel} />
      <div className="fixed inset-0 z-[401] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-sm rounded-[24px] overflow-hidden pointer-events-auto animate-scale"
          style={{ background: cardBg, boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}
        >
          {/* Icon */}
          <div className="flex flex-col items-center px-6 pt-8 pb-5 text-center">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
              style={{ background: danger ? '#FF453A15' : '#0A84FF15' }}
            >
              <Trash2
                className="w-6 h-6"
                style={{ color: danger ? '#FF453A' : '#0A84FF' }}
              />
            </div>
            <h3 className="text-[18px] font-bold leading-tight" style={{ color: text }}>{title}</h3>
            <p className="text-[14px] mt-2 leading-relaxed" style={{ color: textSec }}>{message}</p>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 px-6 pb-6">
            <button
              onClick={onCancel}
              className="py-3.5 rounded-[14px] text-[15px] font-semibold transition-all active:scale-95"
              style={{ background: surfBg, color: textSec }}
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className="py-3.5 rounded-[14px] text-[15px] font-semibold text-white transition-all active:scale-95"
              style={{
                background: danger ? '#FF453A' : '#0A84FF',
                boxShadow: danger ? '0 4px 16px rgba(255,69,58,0.3)' : '0 4px 16px rgba(10,132,255,0.3)',
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
