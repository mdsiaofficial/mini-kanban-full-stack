'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { KanbanIcon, SpinnerIcon } from '@/components/ui/icons';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-slate-900">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
          <KanbanIcon className="w-8 h-8" />
        </div>
        <div className="flex items-center gap-2 text-slate-600 font-medium text-sm">
          <SpinnerIcon className="w-4 h-4 text-indigo-600" />
          <span>Launching Mini Kanban...</span>
        </div>
      </div>
    </main>
  );
}
