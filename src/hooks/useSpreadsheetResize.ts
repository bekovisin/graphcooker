'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ColumnSizeMap, RowSizeMap } from '@/components/editor/spreadsheet/types';
import { DEFAULT_COL_WIDTH, DEFAULT_ROW_HEIGHT, MIN_COL_WIDTH, MIN_ROW_HEIGHT } from '@/components/editor/spreadsheet/constants';

export function useSpreadsheetResize() {
  const [columnWidths, setColumnWidths] = useState<ColumnSizeMap>({});
  const [rowHeights, setRowHeights] = useState<RowSizeMap>({});
  const dragRef = useRef<{
    type: 'col' | 'row';
    index: number;
    startPos: number;
    startSize: number;
  } | null>(null);

  const getColumnWidth = useCallback(
    (colIndex: number) => columnWidths[colIndex] ?? DEFAULT_COL_WIDTH,
    [columnWidths]
  );

  const getRowHeight = useCallback(
    (rowIndex: number) => rowHeights[rowIndex] ?? DEFAULT_ROW_HEIGHT,
    [rowHeights]
  );

  const startColumnResize = useCallback(
    (colIndex: number, startX: number) => {
      dragRef.current = {
        type: 'col',
        index: colIndex,
        startPos: startX,
        startSize: getColumnWidth(colIndex),
      };
    },
    [getColumnWidth]
  );

  const startRowResize = useCallback(
    (rowIndex: number, startY: number) => {
      dragRef.current = {
        type: 'row',
        index: rowIndex,
        startPos: startY,
        startSize: getRowHeight(rowIndex),
      };
    },
    [getRowHeight]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      e.preventDefault();
      const { type, index, startPos, startSize } = dragRef.current;
      if (type === 'col') {
        const delta = e.clientX - startPos;
        const newWidth = Math.max(MIN_COL_WIDTH, startSize + delta);
        setColumnWidths((prev) => ({ ...prev, [index]: newWidth }));
      } else {
        const delta = e.clientY - startPos;
        const newHeight = Math.max(MIN_ROW_HEIGHT, startSize + delta);
        setRowHeights((prev) => ({ ...prev, [index]: newHeight }));
      }
    };

    const handleMouseUp = () => {
      dragRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const autoFitColumn = useCallback(
    (colIndex: number, data: Array<Record<string, unknown>>, columnOrder: string[]) => {
      const colName = columnOrder[colIndex];
      if (!colName) return;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.font = '13px sans-serif';

      let maxWidth = ctx.measureText(colName).width;
      for (const row of data) {
        const val = row[colName];
        if (val != null) {
          const w = ctx.measureText(String(val)).width;
          if (w > maxWidth) maxWidth = w;
        }
      }
      // Add padding
      const width = Math.max(MIN_COL_WIDTH, Math.ceil(maxWidth) + 24);
      setColumnWidths((prev) => ({ ...prev, [colIndex]: width }));
    },
    []
  );

  const autoFitRow = useCallback((_rowIndex: number) => {
    // Reset to default height
    setRowHeights((prev) => {
      const next = { ...prev };
      delete next[_rowIndex];
      return next;
    });
  }, []);

  const resetColumnWidth = useCallback((colIndex: number) => {
    setColumnWidths((prev) => {
      const next = { ...prev };
      delete next[colIndex];
      return next;
    });
  }, []);

  return {
    columnWidths,
    rowHeights,
    getColumnWidth,
    getRowHeight,
    startColumnResize,
    startRowResize,
    autoFitColumn,
    autoFitRow,
    resetColumnWidth,
  };
}
