
import React from 'react';
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
  if (!isOpen) return null;

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <Trash2 className="text-rose-500" size={24} />;
      case 'warning':
        return <AlertCircle className="text-amber-500" size={24} />;
      case 'info':
        return <LogOut className="text-violet-500" size={24} />;
      default:
        return <AlertCircle className="text-blue-500" size={24} />;
    }
  };

  const getIconBg = () => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-500/10';
      case 'warning':
        return 'bg-amber-500/10';
      case 'info':
        return 'bg-violet-500/10';
      default:
        return 'bg-blue-500/10';
    }
  };

  const getConfirmButtonClass = () => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20';
      case 'info':
        return 'bg-violet-600 hover:bg-violet-500 shadow-violet-500/20';
      default:
        return 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20';
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-sm rounded-2xl p-6 shadow-2xl ${
          isDarkMode ? 'bg-[#0f111a] text-white border border-[#27272a]' : 'bg-white text-gray-900 border border-gray-100'
        } transform transition-all animate-in zoom-in-95 duration-200`}
      >
        <div className="flex justify-end mb-2">
          <button 
            onClick={onCancel}
            className={`p-1 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-500' : 'hover:bg-gray-100 text-gray-400'}`}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className={`p-4 ${getIconBg()} rounded-2xl mb-4`}>
            {getIcon()}
          </div>
          
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className={`text-sm mb-8 px-2 ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
            {description}
          </p>

          <div className="flex gap-3 w-full">
            {showCancel && (
              <button 
                onClick={onCancel}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                  isDarkMode 
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {cancelText}
              </button>
            )}
            <button 
              onClick={onConfirm}
              className={`flex-1 py-3 rounded-xl font-bold text-sm text-white shadow-lg transition-all ${getConfirmButtonClass()}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
