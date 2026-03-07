'use client';

import { memo, useCallback, useRef, useState, useEffect } from 'react';
import { ColumnMapping } from '@/types/chart';
import { ColumnRole, ColumnTypeConfig } from './types';
import { COLUMN_ROLE_COLORS, ROW_NUMBER_WIDTH } from './constants';
import { colIndexToLetter, getColumnRole } from './utils';
import { useEditorStore } from '@/store/editorStore';

/** Height of the column-letter row (A, B, C, D) */
export const LETTER_ROW_HEIGHT = 26;
/** Height of the series-name row */
export const SERIES_NAME_ROW_HEIGHT = 28;
/** Total header height */
export const HEADER_HEIGHT = LETTER_ROW_HEIGHT + SERIES_NAME_ROW_HEIGHT;

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
  headerSelected?: boolean;
}

/* ─── Inline series-name editor ─── */
function SeriesNameCell({
  colName,
  width,
  colors,
  onMouseDown,
}: {
  colName: string;
  width: number;
  colors: { headerBg: string; text: string; border: string };
  onMouseDown?: (e: React.MouseEvent) => void;
}) {
  const seriesNames = useEditorStore((s) => s.seriesNames);
  const setSeriesName = useEditorStore((s) => s.setSeriesName);
  const displayName = seriesNames[colName] || colName;

  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(displayName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  // Sync when external name changes
  useEffect(() => {
    setEditValue(seriesNames[colName] || colName);
  }, [seriesNames, colName]);

  const commit = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== colName) {
      setSeriesName(colName, trimmed);
    } else if (!trimmed || trimmed === colName) {
      // Reset to column key name
      setSeriesName(colName, '');
    }
    setEditing(false);
  }, [editValue, colName, setSeriesName]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          }
          if (e.key === 'Escape') {
            setEditValue(displayName);
            setEditing(false);
          }
          e.stopPropagation();
        }}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full h-full px-2 text-[11px] font-semibold outline-none border-none bg-white"
        style={{
          width,
          height: SERIES_NAME_ROW_HEIGHT,
          color: colors.text,
          boxShadow: '0 0 0 2px #3b82f6 inset',
        }}
      />
    );
  }

  return (
    <div
      className="w-full h-full px-2 flex items-center text-[11px] font-semibold truncate cursor-text select-none"
      style={{
        width,
        height: SERIES_NAME_ROW_HEIGHT,
        color: colors.text,
        backgroundColor: colors.headerBg,
      }}
      onMouseDown={(e) => {
        // Single click selects the column (including header for copy)
        onMouseDown?.(e);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditValue(displayName);
        setEditing(true);
      }}
    >
      <span className="truncate pointer-events-none">{displayName}</span>
    </div>
  );
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
  headerSelected,
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
    if (config?.type === 'text') {
      return { label: 'ABC', isNumber: false };
    }
    // Default to number
    return { label: '123', isNumber: true };
  };

  return (
    <div ref={headerRef} className="sticky top-0 z-20 bg-white" style={{ minWidth: 'fit-content' }}>
      {/* ── Row 1: Column letters (A, B, C, D) with type badges ── */}
      <div className="flex" style={{ height: LETTER_ROW_HEIGHT }}>
        {/* Corner cell */}
        <div
          className="shrink-0 sticky left-0 z-30 border-r border-b border-gray-300 bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200"
          style={{ width: ROW_NUMBER_WIDTH, height: LETTER_ROW_HEIGHT }}
          onClick={onSelectAll}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" className="text-gray-400">
            <path d="M0 0L10 0L10 10" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>

        {columns.map((col, colIndex) => {
          const role: ColumnRole = getColumnRole(col, columnMapping);
          const colors = COLUMN_ROLE_COLORS[role];
          const width = getColumnWidth(colIndex);
          const isDragSource = isDraggingColumn && dragSourceIndex === colIndex;
          const typeBadge = getTypeBadge(col);

          return (
            <div
              key={`letter-${col}`}
              className={`shrink-0 relative border-r border-b select-none ${isDragSource ? 'opacity-40' : ''}`}
              style={{
                width,
                height: LETTER_ROW_HEIGHT,
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
              <div className="flex items-center gap-1 px-2 h-full leading-none">
                {/* Column letter badge */}
                <span
                  className="inline-flex items-center justify-center rounded px-1 py-0.5 text-white text-[9px] font-bold"
                  style={{ backgroundColor: colors.badge }}
                >
                  {colIndexToLetter(colIndex)}
                </span>
                {/* Type badge (ABC / 123) */}
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
            </div>
          );
        })}
      </div>

      {/* ── Row 2: Series names (editable) ── */}
      <div className="flex" style={{ height: SERIES_NAME_ROW_HEIGHT }}>
        {/* Row number area — empty for series row */}
        <div
          className={`shrink-0 sticky left-0 z-30 border-r border-b border-gray-300 flex items-center justify-center text-[10px] font-medium select-none ${
            headerSelected ? 'bg-blue-100 text-blue-700' : 'bg-gray-50 text-gray-400'
          }`}
          style={{ width: ROW_NUMBER_WIDTH, height: SERIES_NAME_ROW_HEIGHT }}
        />

        {columns.map((col, colIndex) => {
          const role: ColumnRole = getColumnRole(col, columnMapping);
          const colors = COLUMN_ROLE_COLORS[role];
          const width = getColumnWidth(colIndex);
          const isDropTarget = isDraggingColumn && dropTargetIndex === colIndex;
          const isDragSource = isDraggingColumn && dragSourceIndex === colIndex;

          return (
            <div
              key={`series-${col}`}
              className={`shrink-0 relative border-r border-b select-none ${isDragSource ? 'opacity-40' : ''}`}
              style={{
                width,
                height: SERIES_NAME_ROW_HEIGHT,
                borderColor: colors.border,
              }}
              onMouseEnter={() => handleMouseMoveForDrop(colIndex)}
            >
              <SeriesNameCell
                colName={col}
                width={width}
                colors={colors}
                onMouseDown={(e) => {
                  if (e.button !== 0) return;
                  e.stopPropagation();
                  onColumnClick(colIndex, e);
                }}
              />

              {/* Header selection overlay */}
              {headerSelected && (
                <div className="absolute inset-0 bg-blue-500/10 pointer-events-none z-[5]" />
              )}

              {/* Resize handle (spans both rows via absolute positioning from parent) */}
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
    </div>
  );
});
