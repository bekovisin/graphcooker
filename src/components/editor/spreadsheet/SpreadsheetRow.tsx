'use client';

import { memo, useCallback } from 'react';
import { DataRow } from '@/types/data';
import { CellAddress, NormalizedRange } from './types';
import { ROW_NUMBER_WIDTH } from './constants';
import { isCellInRange, formatCellValue } from './utils';
import { SpreadsheetCell } from './SpreadsheetCell';
import { useEditorStore } from '@/store/editorStore';

interface SpreadsheetRowProps {
  rowIndex: number;
  rowData: DataRow;
  columns: string[];
  getColumnWidth: (colIndex: number) => number;
  rowHeight: number;
  activeCell: CellAddress | null;
  normalizedSelection: NormalizedRange | null;
  editingCell: CellAddress | null;
  editValue: string;
  onEditValueChange: (value: string) => void;
  onCellMouseDown: (row: number, col: number, e: React.MouseEvent) => void;
  onCellDoubleClick: (row: number, col: number) => void;
  onCellEditCommit: (row: number, col: number, value: string) => void;
  onCellEditCancel: () => void;
  onRowNumberMouseDown: (rowIndex: number, e: React.MouseEvent) => void;
  onRowContextMenu: (rowIndex: number, e: React.MouseEvent) => void;
  onRowResize: (rowIndex: number, startY: number) => void;
  onRowDoubleClickResize: (rowIndex: number) => void;
  isRowDragSource: boolean;
  isRowDropTarget: boolean;
  onRowDragStart: (rowIndex: number, e: React.MouseEvent) => void;
  onRowMouseEnterForDrop: (rowIndex: number) => void;
}

export const SpreadsheetRow = memo(function SpreadsheetRow({
  rowIndex,
  rowData,
  columns,
  getColumnWidth,
  rowHeight,
  activeCell,
  normalizedSelection,
  editingCell,
  editValue,
  onEditValueChange,
  onCellMouseDown,
  onCellDoubleClick,
  onCellEditCommit,
  onCellEditCancel,
  onRowNumberMouseDown,
  onRowContextMenu,
  onRowResize,
  onRowDoubleClickResize,
  isRowDragSource,
  isRowDropTarget,
  onRowDragStart,
  onRowMouseEnterForDrop,
}: SpreadsheetRowProps) {
  const columnTypes = useEditorStore((s) => s.columnTypes);

  const isRowSelected =
    normalizedSelection != null &&
    normalizedSelection.minCol === 0 &&
    normalizedSelection.maxCol === columns.length - 1 &&
    rowIndex >= normalizedSelection.minRow &&
    rowIndex <= normalizedSelection.maxRow;

  const handleRowNumberMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      const startX = e.clientX;
      const startY = e.clientY;

      const handleMove = (me: MouseEvent) => {
        const dist = Math.abs(me.clientX - startX) + Math.abs(me.clientY - startY);
        if (dist > 5) {
          document.removeEventListener('mousemove', handleMove);
          document.removeEventListener('mouseup', handleUp);
          onRowDragStart(rowIndex, e);
        }
      };

      const handleUp = () => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
        onRowNumberMouseDown(rowIndex, e);
      };

      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
    },
    [rowIndex, onRowNumberMouseDown, onRowDragStart]
  );

  return (
    <div
      className={`flex ${isRowDragSource ? 'opacity-40' : ''}`}
      style={{ minWidth: 'fit-content' }}
      onMouseEnter={() => onRowMouseEnterForDrop(rowIndex)}
    >
      {/* Row number */}
      <div
        className={`shrink-0 sticky left-0 z-10 border-r border-b flex items-center justify-center text-[11px] font-medium select-none cursor-pointer relative ${
          isRowSelected ? 'bg-blue-100 text-blue-700 border-gray-300' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
        }`}
        style={{ width: ROW_NUMBER_WIDTH, height: rowHeight }}
        onMouseDown={handleRowNumberMouseDown}
        onContextMenu={(e) => {
          e.preventDefault();
          onRowContextMenu(rowIndex, e);
        }}
      >
        {rowIndex + 1}
        {/* Row resize handle */}
        <div
          className="absolute left-0 right-0 bottom-0 h-[3px] cursor-row-resize hover:bg-blue-400/40"
          onMouseDown={(e) => {
            e.stopPropagation();
            onRowResize(rowIndex, e.clientY);
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            onRowDoubleClickResize(rowIndex);
          }}
        />

        {/* Row drop indicator */}
        {isRowDropTarget && (
          <div className="absolute left-0 right-0 top-0 h-[3px] bg-blue-500 z-20" />
        )}
      </div>

      {/* Cells */}
      {columns.map((col, colIndex) => {
        const cellAddr: CellAddress = { row: rowIndex, col: colIndex };
        const isActive = activeCell?.row === rowIndex && activeCell?.col === colIndex;
        const isSelected = normalizedSelection
          ? isCellInRange(cellAddr, normalizedSelection)
          : false;
        const isEditingThis =
          editingCell?.row === rowIndex && editingCell?.col === colIndex;

        const rawValue = rowData[col];
        const displayValue = isEditingThis ? rawValue : formatCellValue(rawValue, columnTypes[col]);

        return (
          <SpreadsheetCell
            key={col}
            value={displayValue}
            width={getColumnWidth(colIndex)}
            height={rowHeight}
            isActive={isActive}
            isSelected={isSelected}
            isEditing={isEditingThis}
            editValue={isEditingThis ? editValue : ''}
            onEditValueChange={onEditValueChange}
            onMouseDown={(e) => onCellMouseDown(rowIndex, colIndex, e)}
            onDoubleClick={() => onCellDoubleClick(rowIndex, colIndex)}
            onEditCommit={(val) => onCellEditCommit(rowIndex, colIndex, val)}
            onEditCancel={onCellEditCancel}
          />
        );
      })}
    </div>
  );
});
