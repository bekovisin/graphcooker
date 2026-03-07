'use client';

import { useCallback } from 'react';
import { DataRow } from '@/types/data';
import { CellAddress, SelectionRange } from '@/components/editor/spreadsheet/types';
import {
  normalizeRange,
  parseClipboardText,
  serializeSelectionToClipboard,
} from '@/components/editor/spreadsheet/utils';

interface UseSpreadsheetClipboardProps {
  data: DataRow[];
  columnOrder: string[];
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
      const newData = data.map((row) => ({ ...row }));
      const newColumnOrder = [...columnOrder];

      // Auto-detect header row: when pasting at top-left (0,0) with multiple rows,
      // or when header is explicitly selected (Ctrl+A), treat first row as series names.
      const shouldTreatFirstAsHeader = headerSelected ||
        (activeCell.row === 0 && activeCell.col === 0 && parsed.length > 1);

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

      // Expand columns if needed
      const maxPasteCols = Math.max(...parsed.map((r) => r.length));
      while (newColumnOrder.length < activeCell.col + maxPasteCols) {
        const newColName = `Column ${newColumnOrder.length + 1}`;
        newColumnOrder.push(newColName);
        newData.forEach((row) => (row[newColName] = ''));
      }

      // Write paste data
      for (let r = 0; r < dataRows.length; r++) {
        for (let c = 0; c < dataRows[r].length; c++) {
          const targetRow = startRow + r;
          const targetCol = activeCell.col + c;
          if (targetRow < newData.length && targetCol < newColumnOrder.length) {
            const colName = newColumnOrder[targetCol];
            const val = dataRows[r][c];
            // Try to parse as number; fall back to comma→dot for decimal separator
            let num = Number(val);
            if (isNaN(num) && val.includes(',')) {
              num = Number(val.replace(',', '.'));
            }
            newData[targetRow][colName] = val !== '' && !isNaN(num) ? num : val;
          }
        }
      }

      onDataChange(newData, newColumnOrder);
    },
    [data, columnOrder, activeCell, headerSelected, onDataChange, setSeriesName, pushHistory]
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
