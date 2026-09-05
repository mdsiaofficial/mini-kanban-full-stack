'use client';

import { useEffect, ReactNode } from 'react';
import { clsx } from 'clsx';
import { CloseIcon } from './icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, description, children, maxWidth = 'md' }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6 text-center">
        {/* Backdrop blur */}
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal dialog box */}
        <div
          className={clsx(
            'relative bg-white rounded-2xl shadow-2xl border border-slate-200/80 text-left w-full p-6 sm:p-7 overflow-hidden transform transition-all animate-modal',
            {
              'max-w-sm': maxWidth === 'sm',
              'max-w-md': maxWidth === 'md',
              'max-w-lg': maxWidth === 'lg',
              'max-w-2xl': maxWidth === 'xl',
            }
          )}
        >
          <div className="flex items-start justify-between mb-5">
            <div>
              {title && <h3 className="text-lg font-bold text-slate-900 leading-6">{title}</h3>}
              {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
            </div>
            <button
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors -mr-1.5 -mt-1.5 cursor-pointer"
              onClick={onClose}
              aria-label="Close"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}
