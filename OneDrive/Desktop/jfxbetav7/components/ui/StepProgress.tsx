import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  label: string;
  description?: string;
}

interface StepProgressProps {
  steps: Step[];
  currentStep: number;
  isDarkMode: boolean;
}

export const StepProgress: React.FC<StepProgressProps> = ({ steps, currentStep, isDarkMode }) => {
  return (
    <div className="flex items-center gap-3 mb-8">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;
        const isClickable = stepNumber <= currentStep;

        return (
          <React.Fragment key={index}>
            <div className="flex items-center flex-1 last:flex-none">
              <button
                disabled={!isClickable}
                className={`flex items-center gap-3 transition-all duration-300 ${
                  isClickable ? 'cursor-pointer' : 'cursor-not-allowed'
                }`}
              >
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300
                    ${isActive
                      ? 'border-[#FF4F01] bg-[#FF4F01] text-white shadow-lg shadow-[#FF4F01]/30 scale-110'
                      : isCompleted
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500'
                        : isDarkMode
                          ? 'border-[#27272a] bg-[#18181b] text-zinc-500'
                          : 'border-slate-200 bg-slate-100 text-slate-400'
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check size={16} strokeWidth={3} />
                  ) : (
                    stepNumber
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <p
                    className={`text-sm font-bold transition-colors ${
                      isActive
                        ? 'text-[#FF4F01]'
                        : isDarkMode
                          ? 'text-zinc-300'
                          : 'text-slate-700'
                    }`}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className={`text-[10px] mt-0.5 ${
                      isDarkMode ? 'text-zinc-500' : 'text-slate-400'
                    }`}>
                      {step.description}
                    </p>
                  )}
                </div>
              </button>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 rounded-full transition-all duration-500 ${
                    isCompleted
                      ? 'bg-emerald-500/40'
                      : isDarkMode
                        ? 'bg-[#27272a]'
                        : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

interface FormProgressProps {
  progress: number;
  isDarkMode: boolean;
  label?: string;
}

export const FormProgress: React.FC<FormProgressProps> = ({ progress, isDarkMode, label }) => {
  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold uppercase tracking-wider ${
            isDarkMode ? 'text-zinc-500' : 'text-slate-500'
          }`}>
            {label}
          </span>
          <span className={`text-xs font-bold ${
            isDarkMode ? 'text-zinc-400' : 'text-slate-600'
          }`}>
            {Math.round(progress)}%
          </span>
        </div>
      )}
      <div className={`h-2 rounded-full overflow-hidden ${
        isDarkMode ? 'bg-[#27272a]' : 'bg-slate-200'
      }`}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#FF4F01] to-orange-400 transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
};
