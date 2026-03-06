'use client';

import { useCallback, useRef } from 'react';
import { DataRow } from '@/types/data';

interface HistoryEntry {
  data: DataRow[];
  columnOrder: string[];
}

const MAX_HISTORY = 50;

export function useSpreadsheetHistory() {
  const undoStack = useRef<HistoryEntry[]>([]);
  const redoStack = useRef<HistoryEntry[]>([]);

  const pushState = useCallback((data: DataRow[], columnOrder: string[]) => {
    undoStack.current.push({
      data: data.map((row) => ({ ...row })),
      columnOrder: [...columnOrder],
    });
    if (undoStack.current.length > MAX_HISTORY) {
      undoStack.current.shift();
    }
    // Clear redo on new action
    redoStack.current = [];
  }, []);

  const undo = useCallback(
    (currentData: DataRow[], currentColumnOrder: string[]): HistoryEntry | null => {
      if (undoStack.current.length === 0) return null;
      // Push current state to redo stack
      redoStack.current.push({
        data: currentData.map((row) => ({ ...row })),
        columnOrder: [...currentColumnOrder],
      });
      return undoStack.current.pop()!;
    },
    []
  );

  const redo = useCallback(
    (currentData: DataRow[], currentColumnOrder: string[]): HistoryEntry | null => {
      if (redoStack.current.length === 0) return null;
      // Push current state to undo stack
      undoStack.current.push({
        data: currentData.map((row) => ({ ...row })),
        columnOrder: [...currentColumnOrder],
      });
      return redoStack.current.pop()!;
    },
    []
  );

  const canUndo = useCallback(() => undoStack.current.length > 0, []);
  const canRedo = useCallback(() => redoStack.current.length > 0, []);

  const clear = useCallback(() => {
    undoStack.current = [];
    redoStack.current = [];
  }, []);

  return { pushState, undo, redo, canUndo, canRedo, clear };
}
