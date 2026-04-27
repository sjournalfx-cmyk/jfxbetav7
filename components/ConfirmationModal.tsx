import React, { useEffect, useRef } from 'react';
import { AlertCircle, Trash2, LogOut, X } from 'lucide-react';

export interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  isDarkMode: boolean;
  showCancel?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
  isDarkMode,
  showCancel = true
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        cancelButtonRef.current?.focus();
      }, 50);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
        return;
      }
      
      if (e.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled])'
        );
        if (!focusableElements || focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <Trash2 className="text-zinc-200" size={22} aria-hidden="true" />;
      case 'warning':
        return <AlertCircle className="text-zinc-200" size={22} aria-hidden="true" />;
      case 'info':
        return <LogOut className="text-zinc-200" size={22} aria-hidden="true" />;
      default:
        return <AlertCircle className="text-zinc-200" size={22} aria-hidden="true" />;
    }
  };

  const getIconBg = () => {
    switch (variant) {
      case 'danger':
        return 'bg-zinc-800';
      case 'warning':
        return 'bg-zinc-800';
      case 'info':
        return 'bg-zinc-800';
      default:
        return 'bg-zinc-800';
    }
  };

  const getConfirmButtonClass = () => {
    switch (variant) {
      case 'danger':
        return 'bg-zinc-700 text-white';
      case 'warning':
        return 'bg-zinc-700 text-white';
      case 'info':
        return 'bg-zinc-700 text-white';
      default:
        return 'bg-zinc-700 text-white';
    }
  };

  const getAriaLabel = () => {
    switch (variant) {
      case 'danger':
        return 'Confirmation required for destructive action';
      case 'warning':
        return 'Confirmation required';
      default:
        return 'Confirmation dialog';
    }
  };

return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      aria-label={getAriaLabel()}
    >
      <div className="absolute inset-0 bg-black/80" />
      <div
        ref={modalRef}
        className="relative w-full max-w-sm rounded-2xl overflow-hidden border border-zinc-800 bg-[#090909] shadow-2xl shadow-black/50 transform transition-all animate-in zoom-in-95 duration-200"
        role="document"
      >
        <div className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${getIconBg()}`}>
              {getIcon()}
            </div>

            <h3 id="modal-title" className="text-xl font-semibold text-white tracking-tight mb-2">{title}</h3>
            <p id="modal-description" className="text-sm leading-6 text-zinc-400 mb-7 px-2">
              {description}
            </p>

            <div className="flex gap-3 w-full" role="group" aria-label="Dialog actions">
              {showCancel && (
                <button
                  onClick={onCancel}
                  className="flex-1 py-3 rounded-xl font-medium text-sm bg-zinc-800 text-zinc-100 border border-zinc-700"
                  ref={cancelButtonRef}
                >
                  {cancelText}
                </button>
              )}
              <button
                onClick={onConfirm}
                className={`flex-1 py-3 rounded-xl font-medium text-sm ${getConfirmButtonClass()}`}
                ref={confirmButtonRef}
                autoFocus={!showCancel}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>

        <div className="h-px w-full bg-zinc-800" />
      </div>
    </div>
  );
};

export default ConfirmationModal;
