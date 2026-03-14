'use client';

import { useCallback, useState } from 'react';
import { CellAddress, SelectionRange } from '@/components/editor/spreadsheet/types';

interface UseSpreadsheetSelectionProps {
  rowCount: number;
  colCount: number;
}

export function useSpreadsheetSelection({ rowCount, colCount }: UseSpreadsheetSelectionProps) {
  const [activeCell, setActiveCellState] = useState<CellAddress | null>(null);
  const [selectionRange, setSelectionRange] = useState<SelectionRange | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [headerSelected, setHeaderSelected] = useState(false);

  const clampCell = useCallback(
    (cell: CellAddress): CellAddress => ({
      row: Math.max(-1, Math.min(cell.row, rowCount - 1)),
      col: Math.max(0, Math.min(cell.col, colCount - 1)),
    }),
    [rowCount, colCount]
  );

  const setActiveCell = useCallback(
    (cell: CellAddress) => {
      const clamped = clampCell(cell);
      setActiveCellState(clamped);
      setSelectionRange({ start: clamped, end: clamped });
      setIsEditing(false);
      setHeaderSelected(clamped.row === -1);
    },
    [clampCell]
  );

  const extendSelection = useCallback(
    (cell: CellAddress) => {
      if (!activeCell) return;
      const clamped = clampCell(cell);
      setSelectionRange({ start: activeCell, end: clamped });
    },
    [activeCell, clampCell]
  );

  const selectAll = useCallback(() => {
    if (rowCount === 0 || colCount === 0) return;
    setActiveCellState({ row: -1, col: 0 });
    setSelectionRange({
      start: { row: -1, col: 0 },
      end: { row: rowCount - 1, col: colCount - 1 },
    });
    setIsEditing(false);
    setHeaderSelected(true);
  }, [rowCount, colCount]);

  const selectColumn = useCallback(
    (colIndex: number) => {
      if (rowCount === 0) return;
      setActiveCellState({ row: -1, col: colIndex });
      setSelectionRange({
        start: { row: -1, col: colIndex },
        end: { row: rowCount - 1, col: colIndex },
      });
      setIsEditing(false);
      setHeaderSelected(true);
    },
    [rowCount]
  );

  const selectRow = useCallback(
    (rowIndex: number) => {
      if (colCount === 0) return;
      setActiveCellState({ row: rowIndex, col: 0 });
      setSelectionRange({
        start: { row: rowIndex, col: 0 },
        end: { row: rowIndex, col: colCount - 1 },
      });
      setIsEditing(false);
    },
    [colCount]
  );

  const clearSelection = useCallback(() => {
    setActiveCellState(null);
    setSelectionRange(null);
    setIsEditing(false);
    setHeaderSelected(false);
  }, []);

  const startEditing = useCallback(
    (initialValue?: string) => {
      if (!activeCell) return;
      setIsEditing(true);
      if (initialValue !== undefined) {
        setEditValue(initialValue);
      }
    },
    [activeCell]
  );

  const stopEditing = useCallback(() => {
    setIsEditing(false);
    setEditValue('');
  }, []);

  const moveActiveCell = useCallback(
    (dRow: number, dCol: number, extend: boolean) => {
      if (!activeCell) {
        if (rowCount > 0 && colCount > 0) {
          setActiveCell({ row: 0, col: 0 });
        }
        return;
      }

      const newCell = clampCell({
        row: activeCell.row + dRow,
        col: activeCell.col + dCol,
      });

      if (extend) {
        const currentEnd = selectionRange?.end || activeCell;
        const newEnd = clampCell({
          row: currentEnd.row + dRow,
          col: currentEnd.col + dCol,
        });
        setSelectionRange({ start: activeCell, end: newEnd });
      } else {
        setActiveCellState(newCell);
        setSelectionRange({ start: newCell, end: newCell });
      }
      setIsEditing(false);
    },
    [activeCell, selectionRange, clampCell, rowCount, colCount, setActiveCell]
  );

  return {
    activeCell,
    selectionRange,
    isEditing,
    editValue,
    headerSelected,
    setEditValue,
    setActiveCell,
    extendSelection,
    selectAll,
    selectColumn,
    selectRow,
    clearSelection,
    startEditing,
    stopEditing,
    moveActiveCell,
  };
}
