'use client';

import { useEffect } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { undo, redo } from '@/lib/history';

export function useGlobalUndoRedo() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip if inside input/textarea/contenteditable (native browser undo)
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) return;

      // Skip if already handled (e.g., by spreadsheet stopPropagation won't reach here,
      // but check defaultPrevented as extra safety)
      if (e.defaultPrevented) return;

      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod || e.key.toLowerCase() !== 'z') return;

      e.preventDefault();
      if (e.shiftKey) {
        redo(useEditorStore);
      } else {
        undo(useEditorStore);
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);
}
