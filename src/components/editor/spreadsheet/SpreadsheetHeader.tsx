'use client';

import { memo, useCallback, useRef } from 'react';
import { ColumnMapping } from '@/types/chart';
import { ColumnRole, ColumnTypeConfig } from './types';
import { COLUMN_ROLE_COLORS, ROW_NUMBER_WIDTH } from './constants';
import { colIndexToLetter, getColumnRole } from './utils';
import { useEditorStore } from '@/store/editorStore';

interface SpreadsheetHeaderProps {
  columns: string[];
  columnMapping: ColumnMapping;
  getColumnWidth: (colIndex: number) => number;
  onColumnResize: (colIndex: number, startX: number) => void;
  onColumnDoubleClickResize: (colIndex: number) => void;
  onColumnClick: (colIndex: number, e: React.MouseEvent) => void;
  onColumnDragStart: (colIndex: number, e: React.MouseEvent) => void;
  onContextMenu: (colIndex: number, e: React.MouseEvent) => void;
  onSelectAll: () => void;
  isDraggingColumn: boolean;
  dragSourceIndex: number | null;
  dropTargetIndex: number | null;
  onDropTargetUpdate: (index: number | null) => void;
  onColumnTypeClick?: (colIndex: number) => void;
}

export const SpreadsheetHeader = memo(function SpreadsheetHeader({
  columns,
  columnMapping,
  getColumnWidth,
  onColumnResize,
  onColumnDoubleClickResize,
  onColumnClick,
  onColumnDragStart,
  onContextMenu,
  onSelectAll,
  isDraggingColumn,
  dragSourceIndex,
  dropTargetIndex,
  onDropTargetUpdate,
  onColumnTypeClick,
}: SpreadsheetHeaderProps) {
  const headerRef = useRef<HTMLDivElement>(null);
  const columnTypes = useEditorStore((s) => s.columnTypes);

  const handleResizeMouseDown = useCallback(
    (colIndex: number, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onColumnResize(colIndex, e.clientX);
    },
    [onColumnResize]
  );

  const handleResizeDoubleClick = useCallback(
    (colIndex: number, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onColumnDoubleClickResize(colIndex);
    },
    [onColumnDoubleClickResize]
  );

  const handleHeaderMouseDown = useCallback(
    (colIndex: number, e: React.MouseEvent) => {
      if (e.button !== 0) return;
      const startX = e.clientX;
      const startY = e.clientY;

      const handleMove = (me: MouseEvent) => {
        const dist = Math.abs(me.clientX - startX) + Math.abs(me.clientY - startY);
        if (dist > 5) {
          document.removeEventListener('mousemove', handleMove);
          document.removeEventListener('mouseup', handleUp);
          onColumnDragStart(colIndex, e);
        }
      };

      const handleUp = () => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
        onColumnClick(colIndex, e);
      };

      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
    },
    [onColumnClick, onColumnDragStart]
  );

  const handleMouseMoveForDrop = useCallback(
    (colIndex: number) => {
      if (isDraggingColumn) {
        onDropTargetUpdate(colIndex);
      }
    },
    [isDraggingColumn, onDropTargetUpdate]
  );

  const getTypeBadge = (colName: string): { label: string; isNumber: boolean } => {
    const config: ColumnTypeConfig | undefined = columnTypes[colName];
    if (config?.type === 'number') {
      return { label: '123', isNumber: true };
    }
    return { label: 'ABC', isNumber: false };
  };

  return (
    <div ref={headerRef} className="flex sticky top-0 z-20 bg-white" style={{ minWidth: 'fit-content' }}>
      {/* Corner cell (row number header) */}
      <div
        className="shrink-0 sticky left-0 z-30 border-r border-b border-gray-300 bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200"
        style={{ width: ROW_NUMBER_WIDTH, height: 48 }}
        onClick={onSelectAll}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" className="text-gray-400">
          <path d="M0 0L10 0L10 10" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Column headers */}
      {columns.map((col, colIndex) => {
        const role: ColumnRole = getColumnRole(col, columnMapping);
        const colors = COLUMN_ROLE_COLORS[role];
        const width = getColumnWidth(colIndex);
        const isDropTarget = isDraggingColumn && dropTargetIndex === colIndex;
        const isDragSource = isDraggingColumn && dragSourceIndex === colIndex;
        const typeBadge = getTypeBadge(col);

        return (
          <div
            key={col}
            className={`shrink-0 relative border-r border-b select-none ${isDragSource ? 'opacity-40' : ''}`}
            style={{
              width,
              height: 48,
              backgroundColor: colors.headerBg,
              borderColor: colors.border,
            }}
            onMouseDown={(e) => handleHeaderMouseDown(colIndex, e)}
            onContextMenu={(e) => {
              e.preventDefault();
              onContextMenu(colIndex, e);
            }}
            onMouseEnter={() => handleMouseMoveForDrop(colIndex)}
          >
            {/* Column letter + type badge */}
            <div className="flex items-center gap-1 px-2 pt-1 leading-none">
              <span
                className="inline-flex items-center justify-center rounded px-1 py-0.5 text-white text-[9px] font-bold"
                style={{ backgroundColor: colors.badge }}
              >
                {colIndexToLetter(colIndex)}
              </span>
              <button
                className="inline-flex items-center justify-center rounded px-1 py-0.5 text-[9px] font-bold border hover:opacity-80 transition-opacity"
                style={{
                  color: typeBadge.isNumber ? '#1565c0' : '#616161',
                  backgroundColor: typeBadge.isNumber ? '#e3f2fd' : '#f5f5f5',
                  borderColor: typeBadge.isNumber ? '#90caf9' : '#e0e0e0',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onColumnTypeClick?.(colIndex);
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {typeBadge.label}
              </button>
            </div>
            {/* Column name */}
            <div
              className="text-[11px] font-semibold px-2 pb-1 truncate leading-tight mt-0.5"
              style={{ color: colors.text }}
            >
              {col}
            </div>

            {/* Resize handle */}
            <div
              className="absolute right-0 top-0 bottom-0 w-[4px] cursor-col-resize hover:bg-blue-400/40 z-10"
              onMouseDown={(e) => handleResizeMouseDown(colIndex, e)}
              onDoubleClick={(e) => handleResizeDoubleClick(colIndex, e)}
            />

            {/* Drop indicator */}
            {isDropTarget && (
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-500 z-20" />
            )}
          </div>
        );
      })}
    </div>
  );
});
