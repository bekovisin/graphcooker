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
 * - Captures clicks on <a> elements to intercept Next.js Link navigation
 * - Patches history.pushState as a fallback for programmatic navigation
 */
export function useUnsavedChangesGuard(isDirty: boolean): UnsavedChangesGuardReturn {
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  const [showDialog, setShowDialog] = useState(false);
  const pendingHrefRef = useRef<string | null>(null);

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

  // Intercept clicks on <a> elements (Next.js Link components) in capture phase
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!isDirtyRef.current) return;

      const anchor = (e.target as HTMLElement).closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Only intercept internal navigation (same origin, not hash-only, not external)
      if (href.startsWith('http') && !href.startsWith(window.location.origin)) return;
      if (href.startsWith('#')) return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      pendingHrefRef.current = href;
      setShowDialog(true);
    };

    // Use capture phase to intercept before Next.js handles the click
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  // Also patch pushState as fallback for programmatic navigation (router.push etc.)
  useEffect(() => {
    const original = window.history.pushState.bind(window.history);

    window.history.pushState = function (...args: Parameters<typeof original>) {
      if (isDirtyRef.current) {
        // Extract URL from pushState args (3rd argument is the URL)
        const url = args[2];
        if (url) {
          pendingHrefRef.current = typeof url === 'string' ? url : url.toString();
          setShowDialog(true);
          return;
        }
      }
      return original(...args);
    };

    return () => {
      window.history.pushState = original;
    };
  }, []);

  const onConfirmLeave = useCallback(() => {
    setShowDialog(false);
    const href = pendingHrefRef.current;
    pendingHrefRef.current = null;
    if (href) {
      // Use window.location for reliable navigation after confirmation
      window.location.href = href;
    }
  }, []);

  const onCancelLeave = useCallback(() => {
    setShowDialog(false);
    pendingHrefRef.current = null;
  }, []);

  return { showDialog, onConfirmLeave, onCancelLeave };
}
