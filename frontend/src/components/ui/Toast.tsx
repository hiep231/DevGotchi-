import React, { useEffect } from 'react';
import { CheckCircle2, Sparkles, X } from 'lucide-react';

export interface ToastProps {
  message: string;
  subMessage?: string;
  type?: 'success' | 'info' | 'reward';
  isOpen: boolean;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  subMessage,
  type = 'success',
  isOpen,
  onClose,
  duration = 3500,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-4 left-0 right-0 mx-auto px-4 z-50 max-w-sm pointer-events-none animate-toast">
      <div className="card-sticker pointer-events-auto bg-[var(--mint-tint)] border-2 border-[var(--ink)] shadow-[0_4px_0_var(--ink)] p-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--mint)] border-2 border-[var(--ink)] text-white flex items-center justify-center shrink-0 shadow-[0_2px_0_var(--ink)]">
            {type === 'reward' ? <Sparkles className="w-5 h-5 text-white" /> : <CheckCircle2 className="w-5 h-5 text-white" />}
          </div>
          <div>
            <div className="font-heading font-extrabold text-sm text-[var(--ink)] leading-snug">
              {message}
            </div>
            {subMessage && (
              <div className="text-xs text-[var(--ink-soft)] font-medium mt-0.5">
                {subMessage}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-[var(--ink-soft)] hover:text-[var(--ink)] p-1 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
