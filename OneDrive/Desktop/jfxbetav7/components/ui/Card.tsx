import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  isDarkMode?: boolean;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, isDarkMode, hoverable, padding = 'md', children, ...props }, ref) => {
    const paddings = {
      none: 'p-0',
      sm: 'p-3',
      md: 'p-5',
      lg: 'p-8',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl border transition-all duration-200',
          isDarkMode
            ? 'bg-zinc-900/50 border-zinc-800/50 backdrop-blur-sm text-zinc-100'
            : 'bg-white border-slate-200 shadow-sm text-slate-900',
          hoverable && (isDarkMode ? 'hover:border-zinc-700 hover:bg-zinc-900' : 'hover:border-slate-300 hover:shadow-md'),
          paddings[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
)
CardHeader.displayName = "CardHeader"

export const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
)
CardTitle.displayName = "CardTitle"

export const CardDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-muted-foreground", className)} {...props} />
)
CardDescription.displayName = "CardDescription"

export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-6 pt-0", className)} {...props} />
)
CardContent.displayName = "CardContent"

export const CardFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex items-center p-6 pt-0", className)} {...props} />
)
CardFooter.displayName = "CardFooter"
