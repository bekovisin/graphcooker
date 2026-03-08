'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface UnsavedChangesGuardReturn {
  showDialog: boolean;
  onConfirmLeave: () => void;
  onCancelLeave: () => void;
}

/**
 * Warns the user before leaving the page when there are unsaved changes.
 * - `beforeunload` covers browser close / refresh / tab close (native only)
 * - Patching `history.pushState` covers Next.js App Router client-side navigation
 *   and shows a custom dialog instead of window.confirm()
 */
export function useUnsavedChangesGuard(isDirty: boolean): UnsavedChangesGuardReturn {
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  const [showDialog, setShowDialog] = useState(false);
  const pendingNavRef = useRef<Parameters<typeof window.history.pushState> | null>(null);
  const originalPushStateRef = useRef<typeof window.history.pushState | null>(null);

  // Browser close / refresh — native beforeunload (cannot be customized)
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

  // Intercept in-app navigation with custom dialog
  useEffect(() => {
    const original = window.history.pushState.bind(window.history);
    originalPushStateRef.current = original;

    window.history.pushState = function (...args: Parameters<typeof original>) {
      if (isDirtyRef.current) {
        pendingNavRef.current = args;
        setShowDialog(true);
        return;
      }
      return original(...args);
    };

    return () => {
      window.history.pushState = original;
    };
  }, []);

  const onConfirmLeave = useCallback(() => {
    setShowDialog(false);
    if (pendingNavRef.current && originalPushStateRef.current) {
      const args = pendingNavRef.current;
      pendingNavRef.current = null;
      originalPushStateRef.current(...args);
    }
  }, []);

  const onCancelLeave = useCallback(() => {
    setShowDialog(false);
    pendingNavRef.current = null;
  }, []);

  return { showDialog, onConfirmLeave, onCancelLeave };
}
