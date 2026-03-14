'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    // Always call checkAuth — the httpOnly cookie is sent automatically
    // with the fetch request; we cannot check it via document.cookie
    checkAuth();
  }, [checkAuth]);

  return <>{children}</>;
}
