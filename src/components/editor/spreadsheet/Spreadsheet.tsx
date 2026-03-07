'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { useSpreadsheetSelection } from '@/hooks/useSpreadsheetSelection';
import { useSpreadsheetClipboard } from '@/hooks/useSpreadsheetClipboard';
import { useSpreadsheetHistory } from '@/hooks/useSpreadsheetHistory';
import { useSpreadsheetResize } from '@/hooks/useSpreadsheetResize';
import { useSpreadsheetDragReorder } from '@/hooks/useSpreadsheetDragReorder';
import { ContextMenuPosition, NormalizedRange } from './types';
import { normalizeRange, generateUniqueColumnName } from './utils';
import { SpreadsheetHeader, HEADER_HEIGHT } from './SpreadsheetHeader';
import { SpreadsheetRow } from './SpreadsheetRow';
import { SpreadsheetContextMenu } from './SpreadsheetContextMenu';
import { useState } from 'react';

export interface SelectionInfo {
  count: number;
  numericCount: number;
  sum: number;
  average: number;
  min: number;
  max: number;
}

interface SpreadsheetProps {
  onUploadFile: () => void;
  onSelectionInfoChange?: (info: SelectionInfo | null) => void;
  onColumnTypeClick?: (colIndex: number) => void;
}

export function Spreadsheet({ onUploadFile, onSelectionInfoChange, onColumnTypeClick }: SpreadsheetProps) {
  const {
    data,
    columnOrder,
    columnMapping,
    seriesNames,
    setSeriesName,
    setDataAndColumns,
    insertRow,
    removeRow,
    insertColumn,
    removeColumn,
    reorderColumn,
    reorderRow,
    sortByColumn,
    updateCell,
  } = useEditorStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null);

  const rowCount = data.length;
  const colCount = columnOrder.length;

  // Hooks
  const history = useSpreadsheetHistory();
  const selection = useSpreadsheetSelection({ rowCount, colCount });
  const resize = useSpreadsheetResize();

  const pushHistory = useCallback(() => {
    history.pushState(data, columnOrder);
  }, [history, data, columnOrder]);

  const handleDataChange = useCallback(
    (newData: typeof data, newColumnOrder: string[]) => {
      setDataAndColumns(newData, newColumnOrder);
    },
    [setDataAndColumns]
  );

  const clipboard = useSpreadsheetClipboard({
    data,
    columnOrder,
    activeCell: selection.activeCell,
    selectionRange: selection.selectionRange,
    headerSelected: selection.headerSelected,
    seriesNames,
    onDataChange: handleDataChange,
    setSeriesName,
    pushHistory,
  });

  const handleReorderColumn = useCallback(
    (from: number, to: number) => {
      pushHistory();
      reorderColumn(from, to);
    },
    [pushHistory, reorderColumn]
  );

  const handleReorderRow = useCallback(
    (from: number, to: number) => {
      pushHistory();
      reorderRow(from, to);
    },
    [pushHistory, reorderRow]
  );

  const dragReorder = useSpreadsheetDragReorder(handleReorderColumn, handleReorderRow);

  // Normalized selection for rendering
  const normalizedSelection: NormalizedRange | null = useMemo(() => {
    if (!selection.selectionRange) return null;
    return normalizeRange(selection.selectionRange);
  }, [selection.selectionRange]);

  // Compute selection info (sum, count, avg, min, max) for the status bar
  useEffect(() => {
    if (!onSelectionInfoChange) return;
    if (!normalizedSelection) {
      onSelectionInfoChange(null);
      return;
    }

    let count = 0;
    let numericCount = 0;
    let sum = 0;
    let min = Infinity;
    let max = -Infinity;

    for (let r = normalizedSelection.minRow; r <= normalizedSelection.maxRow; r++) {
      for (let c = normalizedSelection.minCol; c <= normalizedSelection.maxCol; c++) {
        count++;
        const val = data[r]?.[columnOrder[c]];
        if (val != null && val !== '') {
          const num = typeof val === 'number' ? val : parseFloat(String(val));
          if (!isNaN(num)) {
            numericCount++;
            sum += num;
            if (num < min) min = num;
            if (num > max) max = num;
          }
        }
      }
    }

    if (numericCount === 0) {
      onSelectionInfoChange({ count, numericCount: 0, sum: 0, average: 0, min: 0, max: 0 });
    } else {
      onSelectionInfoChange({
        count,
        numericCount,
        sum,
        average: sum / numericCount,
        min: min === Infinity ? 0 : min,
        max: max === -Infinity ? 0 : max,
      });
    }
  }, [normalizedSelection, data, columnOrder, onSelectionInfoChange]);

  // Re-focus container after editing ends
  const refocusContainer = useCallback(() => {
    setTimeout(() => containerRef.current?.focus(), 0);
  }, []);

  // Cell interactions
  const handleCellMouseDown = useCallback(
    (row: number, col: number, e: React.MouseEvent) => {
      if (e.button !== 0) return;
      containerRef.current?.focus();
      if (e.shiftKey) {
        selection.extendSelection({ row, col });
      } else {
        selection.setActiveCell({ row, col });
      }
    },
    [selection]
  );

  const handleCellDoubleClick = useCallback(
    (row: number, col: number) => {
      selection.setActiveCell({ row, col });
      const val = data[row]?.[columnOrder[col]];
      selection.setEditValue(val != null ? String(val) : '');
      selection.startEditing();
    },
    [selection, data, columnOrder]
  );

  const handleCellEditCommit = useCallback(
    (row: number, col: number, value: string) => {
      pushHistory();
      const colName = columnOrder[col];
      const num = Number(value);
      const parsedValue = value !== '' && !isNaN(num) ? num : value;
      updateCell(row, colName, parsedValue);
      selection.stopEditing();
      refocusContainer();
      // Move down after commit
      if (row < rowCount - 1) {
        selection.setActiveCell({ row: row + 1, col });
      }
    },
    [pushHistory, columnOrder, updateCell, selection, rowCount, refocusContainer]
  );

  const handleCellEditCancel = useCallback(() => {
    selection.stopEditing();
    refocusContainer();
  }, [selection, refocusContainer]);

  // Row interactions
  const handleRowNumberMouseDown = useCallback(
    (rowIndex: number, e: React.MouseEvent) => {
      containerRef.current?.focus();
      if (e.shiftKey && selection.activeCell) {
        selection.extendSelection({ row: rowIndex, col: colCount - 1 });
      } else {
        selection.selectRow(rowIndex);
      }
    },
    [selection, colCount]
  );

  // Context menu
  const handleColumnContextMenu = useCallback(
    (colIndex: number, e: React.MouseEvent) => {
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        targetRow: selection.activeCell?.row ?? 0,
        targetCol: colIndex,
      });
    },
    [selection.activeCell]
  );

  const handleRowContextMenu = useCallback(
    (rowIndex: number, e: React.MouseEvent) => {
      e.preventDefault();
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        targetRow: rowIndex,
        targetCol: selection.activeCell?.col ?? 0,
      });
    },
    [selection.activeCell]
  );

  const handleCellContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (contextMenu) return;
      e.preventDefault();
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        targetRow: selection.activeCell?.row ?? null,
        targetCol: selection.activeCell?.col ?? null,
      });
    },
    [selection.activeCell, contextMenu]
  );

  // Context menu actions
  const handleInsertRowAbove = useCallback(() => {
    if (contextMenu?.targetRow == null) return;
    pushHistory();
    insertRow(contextMenu.targetRow);
  }, [contextMenu, pushHistory, insertRow]);

  const handleInsertRowBelow = useCallback(() => {
    if (contextMenu?.targetRow == null) return;
    pushHistory();
    insertRow(contextMenu.targetRow + 1);
  }, [contextMenu, pushHistory, insertRow]);

  const handleInsertColumnLeft = useCallback(() => {
    if (contextMenu?.targetCol == null) return;
    pushHistory();
    const name = generateUniqueColumnName(columnOrder);
    insertColumn(contextMenu.targetCol, name);
  }, [contextMenu, pushHistory, columnOrder, insertColumn]);

  const handleInsertColumnRight = useCallback(() => {
    if (contextMenu?.targetCol == null) return;
    pushHistory();
    const name = generateUniqueColumnName(columnOrder);
    insertColumn(contextMenu.targetCol + 1, name);
  }, [contextMenu, pushHistory, columnOrder, insertColumn]);

  const handleRemoveRow = useCallback(() => {
    if (contextMenu?.targetRow == null) return;
    pushHistory();
    removeRow(contextMenu.targetRow);
  }, [contextMenu, pushHistory, removeRow]);

  const handleRemoveColumn = useCallback(() => {
    if (contextMenu?.targetCol == null) return;
    pushHistory();
    removeColumn(contextMenu.targetCol);
  }, [contextMenu, pushHistory, removeColumn]);

  const handleSortAscending = useCallback(() => {
    if (contextMenu?.targetCol == null) return;
    pushHistory();
    sortByColumn(columnOrder[contextMenu.targetCol], 'asc');
  }, [contextMenu, pushHistory, columnOrder, sortByColumn]);

  const handleSortDescending = useCallback(() => {
    if (contextMenu?.targetCol == null) return;
    pushHistory();
    sortByColumn(columnOrder[contextMenu.targetCol], 'desc');
  }, [contextMenu, pushHistory, columnOrder, sortByColumn]);

  // Undo / Redo
  const handleUndo = useCallback(() => {
    const entry = history.undo(data, columnOrder);
    if (entry) {
      setDataAndColumns(entry.data, entry.columnOrder);
    }
  }, [history, data, columnOrder, setDataAndColumns]);

  const handleRedo = useCallback(() => {
    const entry = history.redo(data, columnOrder);
    if (entry) {
      setDataAndColumns(entry.data, entry.columnOrder);
    }
  }, [history, data, columnOrder, setDataAndColumns]);

  // Keyboard handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Don't handle if editing (let the input handle it)
      if (selection.isEditing) return;

      const isMod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      // Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y (undo/redo)
      if (isMod && key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }
      if (isMod && (key === 'y' || (key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Ctrl+C / Ctrl+X / Ctrl+V
      if (isMod && key === 'c') {
        e.preventDefault();
        clipboard.handleCopy();
        return;
      }
      if (isMod && key === 'x') {
        e.preventDefault();
        clipboard.handleCut();
        return;
      }
      if (isMod && key === 'v') {
        e.preventDefault();
        clipboard.handlePaste();
        return;
      }

      // Ctrl+A
      if (isMod && key === 'a') {
        e.preventDefault();
        selection.selectAll();
        return;
      }

      // Arrow keys
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        selection.moveActiveCell(-1, 0, e.shiftKey);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selection.moveActiveCell(1, 0, e.shiftKey);
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        selection.moveActiveCell(0, -1, e.shiftKey);
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        selection.moveActiveCell(0, 1, e.shiftKey);
        return;
      }

      // Tab
      if (e.key === 'Tab') {
        e.preventDefault();
        selection.moveActiveCell(0, e.shiftKey ? -1 : 1, false);
        return;
      }

      // Enter
      if (e.key === 'Enter') {
        e.preventDefault();
        if (selection.activeCell) {
          const val = data[selection.activeCell.row]?.[columnOrder[selection.activeCell.col]];
          selection.setEditValue(val != null ? String(val) : '');
          selection.startEditing();
        }
        return;
      }

      // F2
      if (e.key === 'F2') {
        e.preventDefault();
        if (selection.activeCell) {
          const val = data[selection.activeCell.row]?.[columnOrder[selection.activeCell.col]];
          selection.setEditValue(val != null ? String(val) : '');
          selection.startEditing();
        }
        return;
      }

      // Delete / Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        clipboard.handleDelete();
        return;
      }

      // Escape
      if (e.key === 'Escape') {
        selection.clearSelection();
        return;
      }

      // Printable character - start editing
      if (e.key.length === 1 && !isMod) {
        e.preventDefault();
        if (selection.activeCell) {
          selection.setEditValue(e.key);
          selection.startEditing(e.key);
        }
      }
    },
    [selection, clipboard, data, columnOrder, handleUndo, handleRedo]
  );

  // Paste event handler (for when Clipboard API is blocked)
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      if (selection.isEditing) return;
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      if (text) {
        clipboard.handlePaste(text);
      }
    },
    [selection.isEditing, clipboard]
  );

  // Mouse move for drag selection
  const handleMouseMoveForSelection = useCallback(
    (e: React.MouseEvent) => {
      if (e.buttons !== 1 || !selection.activeCell || selection.isEditing || dragReorder.isDragging) return;

      // Find cell under cursor
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const scrollLeft = container.scrollLeft;
      const scrollTop = container.scrollTop;

      const x = e.clientX - rect.left + scrollLeft - 48; // subtract row number width
      const y = e.clientY - rect.top + scrollTop - HEADER_HEIGHT; // subtract header height (letter row + series name row)

      // Find column
      let cumX = 0;
      let col = 0;
      for (let c = 0; c < colCount; c++) {
        const w = resize.getColumnWidth(c);
        if (x < cumX + w) {
          col = c;
          break;
        }
        cumX += w;
        col = c;
      }

      // Find row
      let cumY = 0;
      let row = 0;
      for (let r = 0; r < rowCount; r++) {
        const h = resize.getRowHeight(r);
        if (y < cumY + h) {
          row = r;
          break;
        }
        cumY += h;
        row = r;
      }

      selection.extendSelection({ row, col });
    },
    [selection, dragReorder.isDragging, colCount, rowCount, resize]
  );

  // Column auto-fit
  const handleColumnDoubleClickResize = useCallback(
    (colIndex: number) => {
      resize.autoFitColumn(colIndex, data, columnOrder);
    },
    [resize, data, columnOrder]
  );

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto relative outline-none bg-white select-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onContextMenu={handleCellContextMenu}
      onMouseMove={handleMouseMoveForSelection}
    >
      {/* Header */}
      <SpreadsheetHeader
        columns={columnOrder}
        columnMapping={columnMapping}
        getColumnWidth={resize.getColumnWidth}
        onColumnResize={resize.startColumnResize}
        onColumnDoubleClickResize={handleColumnDoubleClickResize}
        onColumnClick={(colIndex, e) => {
          containerRef.current?.focus();
          if (e.shiftKey && selection.activeCell) {
            selection.extendSelection({ row: rowCount - 1, col: colIndex });
          } else {
            selection.selectColumn(colIndex);
          }
        }}
        onColumnDragStart={dragReorder.startColumnDrag}
        onContextMenu={handleColumnContextMenu}
        onSelectAll={selection.selectAll}
        isDraggingColumn={dragReorder.dragType === 'column'}
        dragSourceIndex={dragReorder.dragSourceIndex}
        dropTargetIndex={dragReorder.dropTargetIndex}
        onDropTargetUpdate={dragReorder.updateDropTarget}
        onColumnTypeClick={onColumnTypeClick}
        headerSelected={selection.headerSelected}
      />

      {/* Rows */}
      {data.map((rowData, rowIndex) => (
        <SpreadsheetRow
          key={rowIndex}
          rowIndex={rowIndex}
          rowData={rowData}
          columns={columnOrder}
          getColumnWidth={resize.getColumnWidth}
          rowHeight={resize.getRowHeight(rowIndex)}
          activeCell={selection.activeCell}
          normalizedSelection={normalizedSelection}
          editingCell={selection.isEditing ? selection.activeCell : null}
          editValue={selection.editValue}
          onEditValueChange={selection.setEditValue}
          onCellMouseDown={handleCellMouseDown}
          onCellDoubleClick={handleCellDoubleClick}
          onCellEditCommit={handleCellEditCommit}
          onCellEditCancel={handleCellEditCancel}
          onRowNumberMouseDown={handleRowNumberMouseDown}
          onRowContextMenu={handleRowContextMenu}
          onRowResize={resize.startRowResize}
          onRowDoubleClickResize={resize.autoFitRow}
          isRowDragSource={dragReorder.dragType === 'row' && dragReorder.dragSourceIndex === rowIndex}
          isRowDropTarget={dragReorder.dragType === 'row' && dragReorder.dropTargetIndex === rowIndex}
          onRowDragStart={dragReorder.startRowDrag}
          onRowMouseEnterForDrop={(idx) => {
            if (dragReorder.dragType === 'row') {
              dragReorder.updateDropTarget(idx);
            }
          }}
        />
      ))}

      {/* Context Menu */}
      <SpreadsheetContextMenu
        position={contextMenu}
        onClose={() => setContextMenu(null)}
        onInsertRowAbove={handleInsertRowAbove}
        onInsertRowBelow={handleInsertRowBelow}
        onInsertColumnLeft={handleInsertColumnLeft}
        onInsertColumnRight={handleInsertColumnRight}
        onRemoveRow={handleRemoveRow}
        onRemoveColumn={handleRemoveColumn}
        onSortAscending={handleSortAscending}
        onSortDescending={handleSortDescending}
        onCombineColumns={() => {}}
        onUploadFile={onUploadFile}
      />
    </div>
  );
}
