'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface DragState {
  type: 'column' | 'row';
  sourceIndex: number;
  currentX: number;
  currentY: number;
}

export function useSpreadsheetDragReorder(
  onReorderColumn: (from: number, to: number) => void,
  onReorderRow: (from: number, to: number) => void
) {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const dropTargetRef = useRef<number | null>(null);

  const startColumnDrag = useCallback((colIndex: number, e: React.MouseEvent) => {
    const state: DragState = {
      type: 'column',
      sourceIndex: colIndex,
      currentX: e.clientX,
      currentY: e.clientY,
    };
    dragRef.current = state;
    setDragState(state);
  }, []);

  const startRowDrag = useCallback((rowIndex: number, e: React.MouseEvent) => {
    const state: DragState = {
      type: 'row',
      sourceIndex: rowIndex,
      currentX: e.clientX,
      currentY: e.clientY,
    };
    dragRef.current = state;
    setDragState(state);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      e.preventDefault();
      const updated = {
        ...dragRef.current,
        currentX: e.clientX,
        currentY: e.clientY,
      };
      dragRef.current = updated;
      setDragState(updated);
    };

    const handleMouseUp = () => {
      if (!dragRef.current) return;
      const { type, sourceIndex } = dragRef.current;
      const target = dropTargetRef.current;
      if (target !== null && target !== sourceIndex) {
        if (type === 'column') {
          onReorderColumn(sourceIndex, target);
        } else {
          onReorderRow(sourceIndex, target);
        }
      }
      dragRef.current = null;
      dropTargetRef.current = null;
      setDragState(null);
      setDropTargetIndex(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onReorderColumn, onReorderRow]);

  const updateDropTarget = useCallback((index: number | null) => {
    dropTargetRef.current = index;
    setDropTargetIndex(index);
  }, []);

  return {
    dragState,
    dropTargetIndex,
    startColumnDrag,
    startRowDrag,
    updateDropTarget,
    isDragging: dragState !== null,
    dragType: dragState?.type ?? null,
    dragSourceIndex: dragState?.sourceIndex ?? null,
  };
}
