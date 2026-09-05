import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import { clsx } from 'clsx';
import { SpinnerIcon } from './icons';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'subtle';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 select-none cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed active:scale-[0.98]',
          {
            // Primary - deep indigo gradient
            'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 active:bg-indigo-800 focus-visible:ring-indigo-500 shadow-indigo-200':
              variant === 'primary',
            // Secondary
            'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300 focus-visible:ring-slate-400':
              variant === 'secondary',
            // Outline
            'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 focus-visible:ring-indigo-500 shadow-xs':
              variant === 'outline',
            // Danger
            'bg-rose-600 text-white shadow-sm hover:bg-rose-700 active:bg-rose-800 focus-visible:ring-rose-500 shadow-rose-200':
              variant === 'danger',
            // Ghost
            'bg-transparent text-slate-600 hover:bg-slate-100 active:bg-slate-200 hover:text-slate-900 focus-visible:ring-slate-400':
              variant === 'ghost',
            // Subtle
            'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 active:bg-indigo-200 focus-visible:ring-indigo-500':
              variant === 'subtle',
          },
          {
            'px-2 py-1 text-xs rounded-md': size === 'xs',
            'px-2.5 py-1.5 text-xs tracking-wide': size === 'sm',
            'px-4 py-2 text-sm': size === 'md',
            'px-5 py-2.5 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <SpinnerIcon className="w-4 h-4 text-current" />
            <span>{children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
