'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    // Skip API call if no session cookie exists — saves ~900ms on landing page
    const hasCookie = document.cookie.includes('gc_session');
    if (hasCookie) {
      checkAuth();
    } else {
      // Immediately set not authenticated without network request
      useAuthStore.setState({ isLoading: false, isAuthenticated: false, user: null });
    }
  }, [checkAuth]);

  return <>{children}</>;
}
