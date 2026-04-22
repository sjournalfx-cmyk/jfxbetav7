import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'bg-[#FF4F01] text-white hover:bg-[#FF4F01]/90 shadow-lg shadow-[#FF4F01]/20 active:scale-[0.98]',
      secondary: 'bg-zinc-850 text-zinc-100 hover:bg-zinc-800 border border-zinc-700/50 active:scale-[0.98]',
      outline: 'bg-transparent border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white',
      ghost: 'bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white',
      destructive: 'bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-600/20 active:scale-[0.98]',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3.5 text-base font-bold',
      icon: 'p-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FF4F01]/40 disabled:opacity-50 disabled:cursor-not-allowed gap-2',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (
          <>
            {leftIcon && <span className="inline-flex">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="inline-flex">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
