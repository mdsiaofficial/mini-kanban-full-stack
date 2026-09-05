'use client';

import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { CheckIcon, CloseIcon } from './icons';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export function Toast({ message, type = 'info', onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 250);
    }, 3500);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={clsx(
        'fixed bottom-5 right-5 z-50 transform transition-all duration-250 ease-out flex items-center shadow-xl rounded-xl border px-4 py-3 min-w-[280px] max-w-sm',
        isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-2 opacity-0 scale-95',
        {
          'bg-emerald-50 text-emerald-900 border-emerald-200': type === 'success',
          'bg-rose-50 text-rose-900 border-rose-200': type === 'error',
          'bg-indigo-50 text-indigo-900 border-indigo-200': type === 'info',
        }
      )}
    >
      <div className="mr-3 shrink-0">
        {type === 'success' && (
          <div className="w-6 h-6 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center">
            <CheckIcon className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        )}
        {type === 'error' && (
          <div className="w-6 h-6 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center font-bold text-xs">
            !
          </div>
        )}
        {type === 'info' && (
          <div className="w-6 h-6 rounded-full bg-indigo-200 text-indigo-800 flex items-center justify-center font-serif font-bold text-xs">
            i
          </div>
        )}
      </div>

      <p className="text-sm font-medium flex-1 pr-2 leading-snug">{message}</p>

      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 200);
        }}
        className="text-current opacity-60 hover:opacity-100 p-1 rounded-md transition-opacity cursor-pointer"
        aria-label="Dismiss toast"
      >
        <CloseIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
