'use client';

import { useCallback } from 'react';
import { DataRow } from '@/types/data';
import { CellAddress, ColumnTypeConfig, SelectionRange } from '@/components/editor/spreadsheet/types';
import {
  normalizeRange,
  parseClipboardText,
  serializeSelectionToClipboard,
  generateUniqueColumnName,
} from '@/components/editor/spreadsheet/utils';

interface UseSpreadsheetClipboardProps {
  data: DataRow[];
  columnOrder: string[];
  columnTypes: Record<string, ColumnTypeConfig>;
  activeCell: CellAddress | null;
  selectionRange: SelectionRange | null;
  headerSelected: boolean;
  seriesNames: Record<string, string>;
  onDataChange: (data: DataRow[], columnOrder: string[]) => void;
  setSeriesName: (colName: string, displayName: string) => void;
  pushHistory: () => void;
}

export function useSpreadsheetClipboard({
  data,
  columnOrder,
  columnTypes,
  activeCell,
  selectionRange,
  headerSelected,
  seriesNames,
  onDataChange,
  setSeriesName,
  pushHistory,
}: UseSpreadsheetClipboardProps) {
  const handleCopy = useCallback(async () => {
    if (!selectionRange) return;
    const range = normalizeRange(selectionRange);
    let text = '';

    // If header is selected, prepend series names as first row
    if (headerSelected) {
      const headerCells: string[] = [];
      for (let c = range.minCol; c <= range.maxCol; c++) {
        const col = columnOrder[c];
        headerCells.push(seriesNames[col] || col || '');
      }
      text = headerCells.join('\t') + '\n';
    }

    text += serializeSelectionToClipboard(data, columnOrder, range);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback: create a textarea and copy
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }, [data, columnOrder, selectionRange, headerSelected, seriesNames]);

  const handleCut = useCallback(async () => {
    if (!selectionRange) return;
    await handleCopy();
    pushHistory();
    const range = normalizeRange(selectionRange);
    const newData = data.map((row) => ({ ...row }));
    for (let r = range.minRow; r <= range.maxRow; r++) {
      for (let c = range.minCol; c <= range.maxCol; c++) {
        if (newData[r] && columnOrder[c]) {
          newData[r][columnOrder[c]] = '';
        }
      }
    }
    onDataChange(newData, columnOrder);
  }, [data, columnOrder, selectionRange, handleCopy, onDataChange, pushHistory]);

  const handlePaste = useCallback(
    async (clipboardText?: string) => {
      if (!activeCell) return;
      let text = clipboardText;
      if (!text) {
        try {
          text = await navigator.clipboard.readText();
        } catch {
          return;
        }
      }
      if (!text) return;

      pushHistory();
      const parsed = parseClipboardText(text);
      let newData = data.map((row) => ({ ...row }));
      let newColumnOrder = [...columnOrder];

      // Detect whether ALL cells are selected — works for Ctrl+A, corner click,
      // or manual drag-select covering the entire grid.
      const allSelected = (() => {
        if (headerSelected) return true;
        if (!selectionRange || data.length === 0 || columnOrder.length === 0) return false;
        const range = normalizeRange(selectionRange);
        return range.minRow === 0 && range.minCol === 0 &&
          range.maxRow >= data.length - 1 && range.maxCol >= columnOrder.length - 1;
      })();

      // Treat first clipboard row as series names only when the entire grid
      // is selected — regardless of how the selection was made.
      const shouldTreatFirstAsHeader = allSelected;

      const maxPasteCols = Math.max(...parsed.map((r) => r.length));

      // Full grid paste: replace the entire grid to match the clipboard exactly.
      const isFullGridPaste = allSelected &&
        activeCell.row === 0 && activeCell.col === 0;

      if (isFullGridPaste) {
        // Trim excess columns from the target
        if (newColumnOrder.length > maxPasteCols) {
          newColumnOrder = newColumnOrder.slice(0, maxPasteCols);
        }
        // Add missing columns using unique names
        while (newColumnOrder.length < maxPasteCols) {
          const newColName = generateUniqueColumnName(newColumnOrder);
          newColumnOrder.push(newColName);
        }
        // Start with fresh data (full replacement)
        newData = [];
      } else {
        // Normal partial paste: expand columns if needed, using unique names
        while (newColumnOrder.length < activeCell.col + maxPasteCols) {
          const newColName = generateUniqueColumnName(newColumnOrder);
          newColumnOrder.push(newColName);
          newData.forEach((row) => (row[newColName] = ''));
        }
      }

      let dataRows = parsed;
      if (shouldTreatFirstAsHeader && parsed.length > 0) {
        const headerRow = parsed[0];
        for (let c = 0; c < headerRow.length; c++) {
          const targetCol = activeCell.col + c;
          if (targetCol < newColumnOrder.length) {
            const colName = newColumnOrder[targetCol];
            setSeriesName(colName, headerRow[c]);
          }
        }
        dataRows = parsed.slice(1);
      }

      // Expand rows if needed
      const startRow = shouldTreatFirstAsHeader ? 0 : activeCell.row;
      while (newData.length < startRow + dataRows.length) {
        const emptyRow: DataRow = {};
        newColumnOrder.forEach((col) => (emptyRow[col] = ''));
        newData.push(emptyRow);
      }

      // Write paste data
      for (let r = 0; r < dataRows.length; r++) {
        for (let c = 0; c < dataRows[r].length; c++) {
          const targetRow: number = startRow + r;
          const targetCol: number = activeCell.col + c;
          if (targetRow < newData.length && targetCol < newColumnOrder.length) {
            const colName = newColumnOrder[targetCol];
            const val = dataRows[r][c];
            // If column type is 'text', always store as string
            if (columnTypes[colName]?.type === 'text') {
              newData[targetRow][colName] = val;
            } else {
              let num = Number(val);
              if (isNaN(num) && val.includes(',')) {
                num = Number(val.replace(',', '.'));
              }
              newData[targetRow][colName] = val !== '' && !isNaN(num) ? num : val;
            }
          }
        }
      }

      onDataChange(newData, newColumnOrder);
    },
    [data, columnOrder, columnTypes, activeCell, selectionRange, headerSelected, onDataChange, setSeriesName, pushHistory]
  );

  const handleDelete = useCallback(() => {
    if (!selectionRange) return;
    pushHistory();
    const range = normalizeRange(selectionRange);
    const newData = data.map((row) => ({ ...row }));
    for (let r = range.minRow; r <= range.maxRow; r++) {
      for (let c = range.minCol; c <= range.maxCol; c++) {
        if (newData[r] && columnOrder[c]) {
          newData[r][columnOrder[c]] = '';
        }
      }
    }
    onDataChange(newData, columnOrder);
  }, [data, columnOrder, selectionRange, onDataChange, pushHistory]);

  return { handleCopy, handleCut, handlePaste, handleDelete };
}
