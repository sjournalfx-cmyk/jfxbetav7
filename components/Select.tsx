import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  icon?: React.ElementType;
  placeholder?: string;
  isDarkMode: boolean;
  className?: string;
  error?: string;
  disabled?: boolean;
}

const Label = ({ children, className = "" }: { children?: React.ReactNode, className?: string }) => (
  <label className={`block text-[11px] font-bold uppercase tracking-widest mb-2 opacity-60 ${className}`}>
    {children}
  </label>
);

export const Select: React.FC<SelectProps> = ({ 
  label, 
  value, 
  onChange, 
  options, 
  icon: Icon, 
  placeholder = "Select...", 
  isDarkMode, 
  className = "",
  error,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);
  const displayLabel = selectedOption ? selectedOption.label : value || placeholder;

  return (
    <div className={`relative group ${className} ${disabled ? 'pointer-events-none opacity-50' : ''}`} ref={containerRef}>
      {label && <Label>{label}</Label>}
      
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full text-left ${Icon ? 'pl-11' : 'pl-4'} pr-10 py-3.5 rounded-lg border outline-none font-medium transition-all text-sm flex items-center justify-between relative
          ${isOpen ? 'ring-2 ring-violet-500/20 border-violet-500' : ''}
          ${error ? 'border-rose-500 ring-rose-500/10' : ''}
          ${isDarkMode 
            ? 'bg-[#18181b] border-[#27272a] text-zinc-100 hover:bg-[#27272a]' 
            : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50 shadow-sm'
          }
          ${disabled ? 'cursor-not-allowed bg-zinc-100 dark:bg-zinc-900/50' : ''}
        `}
      >
        {Icon && (
           <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ${isOpen ? 'text-violet-500' : 'text-zinc-400'}`}>
              <Icon size={16} strokeWidth={2} />
           </div>
        )}
        <span className={!value ? "opacity-50" : ""}>{displayLabel}</span>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none text-zinc-500">
          <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
        </div>
      </button>

      {isOpen && (
        <div className={`absolute left-0 right-0 mt-2 rounded-xl border shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top
          ${isDarkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-slate-200'}
        `}>
          <div className="max-h-60 overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
            {options.length > 0 ? (
              options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-3
                      ${isSelected 
                        ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20' 
                        : isDarkMode 
                          ? 'text-zinc-300 hover:bg-[#27272a]' 
                          : 'text-slate-700 hover:bg-slate-100'
                      }
                    `}
                  >
                    <div className={`w-4 flex items-center justify-center shrink-0 ${isSelected ? 'text-white' : 'opacity-0'}`}>
                        <Check size={14} />
                    </div>
                    <span className="truncate">{option.label}</span>
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-2.5 text-sm opacity-50 text-center italic">No options available</div>
            )}
          </div>
        </div>
      )}
      {error && <p className="mt-1.5 text-[10px] font-bold text-rose-500 uppercase tracking-wider">{error}</p>}
    </div>
  );
};
