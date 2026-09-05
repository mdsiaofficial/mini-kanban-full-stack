'use client';

import { useEffect, useState } from 'react';
import { clsx } from 'clsx';

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
      setTimeout(onClose, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={clsx(
        'fixed bottom-4 right-4 z-50 transform transition-all duration-300',
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      <div
        className={clsx(
          'px-4 py-3 rounded-lg shadow-lg text-white',
          {
            'bg-green-600': type === 'success',
            'bg-red-600': type === 'error',
            'bg-blue-600': type === 'info',
          }
        )}
      >
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  );
}
