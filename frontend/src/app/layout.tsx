'use client';

import type { Metadata } from 'next';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mini Kanban Board',
  description: 'A collaborative Kanban board application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
