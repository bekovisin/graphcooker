'use client';

import { useEffect, useRef } from 'react';

/**
 * Warns the user before leaving the page when there are unsaved changes.
 * - `beforeunload` covers browser close / refresh / tab close
 * - Patching `history.pushState` covers Next.js App Router client-side navigation
 */
export function useUnsavedChangesGuard(isDirty: boolean) {
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  // Browser close / refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Intercept in-app navigation (Next.js App Router client-side nav uses pushState)
  useEffect(() => {
    const originalPushState = window.history.pushState.bind(window.history);

    window.history.pushState = function (...args: Parameters<typeof originalPushState>) {
      if (isDirtyRef.current) {
        const confirmed = window.confirm(
          'You have unsaved changes. Are you sure you want to leave?'
        );
        if (!confirmed) return;
      }
      return originalPushState(...args);
    };

    return () => {
      window.history.pushState = originalPushState;
    };
  }, []);
}
