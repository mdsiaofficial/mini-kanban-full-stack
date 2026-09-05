import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef, ReactNode } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightElement?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightElement, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-150',
              'focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20',
              'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
              leftIcon && 'pl-10',
              rightElement && 'pr-10',
              error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 text-rose-900',
              className
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-2.5 flex items-center">
              {rightElement}
            </div>
          )}
        </div>
        {error && <p className="text-xs font-medium text-rose-600 animate-fadeIn">{error}</p>}
        {!error && helperText && <p className="text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, rows = 3, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={textareaId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={clsx(
            'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-150',
            'focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20',
            'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed resize-y',
            error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 text-rose-900',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs font-medium text-rose-600 animate-fadeIn">{error}</p>}
        {!error && helperText && <p className="text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
