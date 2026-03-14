'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    // gc_logged_in is a non-httpOnly companion cookie set alongside the
    // httpOnly gc_session JWT. It contains no sensitive data — just a flag
    // so we can skip the /api/auth/me call for unauthenticated visitors.
    const hasCookie = document.cookie.includes('gc_logged_in');
    if (hasCookie) {
      checkAuth();
    } else {
      useAuthStore.setState({ isLoading: false, isAuthenticated: false, user: null });
    }
  }, [checkAuth]);

  return <>{children}</>;
}
