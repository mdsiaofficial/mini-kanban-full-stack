import { HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverEffect = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'bg-white rounded-xl border border-slate-200/80 shadow-xs transition-all duration-200',
          hoverEffect && 'hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5',
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={clsx('p-5 pb-3 border-b border-slate-100', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={clsx('p-5', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={clsx('p-5 pt-3 border-t border-slate-100 flex items-center', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';
