'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ContextMenuPosition } from './types';

interface SpreadsheetContextMenuProps {
  position: ContextMenuPosition | null;
  onClose: () => void;
  onInsertRowAbove: () => void;
  onInsertRowBelow: () => void;
  onInsertColumnLeft: () => void;
  onInsertColumnRight: () => void;
  onRemoveRow: () => void;
  onRemoveColumn: () => void;
  onSortAscending: () => void;
  onSortDescending: () => void;
  onCombineColumns: () => void;
  onUploadFile: () => void;
  selectedRowCount?: number;
  selectedColCount?: number;
}

function MenuItem({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      className={`w-full text-left px-3 py-1.5 text-[13px] ${
        disabled
          ? 'text-gray-300 cursor-not-allowed'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onClick();
      }}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

function Divider() {
  return <div className="border-t border-gray-200 my-1" />;
}

export function SpreadsheetContextMenu({
  position,
  onClose,
  onInsertRowAbove,
  onInsertRowBelow,
  onInsertColumnLeft,
  onInsertColumnRight,
  onRemoveRow,
  onRemoveColumn,
  onSortAscending,
  onSortDescending,
  onCombineColumns,
  onUploadFile,
  selectedRowCount = 0,
  selectedColCount = 0,
}: SpreadsheetContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!position) return;

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Delay to avoid immediate close from the same right-click
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleKeyDown);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [position, onClose]);

  if (!position) return null;

  const hasRow = position.targetRow !== null;
  const hasCol = position.targetCol !== null;

  const menu = (
    <div
      ref={menuRef}
      className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-[100] min-w-[200px]"
      style={{ left: position.x, top: position.y }}
    >
      <MenuItem label="Insert row above" onClick={() => { onInsertRowAbove(); onClose(); }} disabled={!hasRow} />
      <MenuItem label="Insert row below" onClick={() => { onInsertRowBelow(); onClose(); }} disabled={!hasRow} />
      <Divider />
      <MenuItem label="Insert column left" onClick={() => { onInsertColumnLeft(); onClose(); }} disabled={!hasCol} />
      <MenuItem label="Insert column right" onClick={() => { onInsertColumnRight(); onClose(); }} disabled={!hasCol} />
      <Divider />
      <MenuItem label={selectedRowCount > 1 ? `Remove ${selectedRowCount} rows` : "Remove row"} onClick={() => { onRemoveRow(); onClose(); }} disabled={!hasRow && selectedRowCount === 0} />
      <MenuItem label={selectedColCount > 1 ? `Remove ${selectedColCount} columns` : "Remove column"} onClick={() => { onRemoveColumn(); onClose(); }} disabled={!hasCol && selectedColCount === 0} />
      <Divider />
      <MenuItem label="Sort by column (A→Z)" onClick={() => { onSortAscending(); onClose(); }} disabled={!hasCol} />
      <MenuItem label="Sort by column (Z→A)" onClick={() => { onSortDescending(); onClose(); }} disabled={!hasCol} />
      <Divider />
      <MenuItem
        label='Combine columns ("unpivot")'
        onClick={() => { onCombineColumns(); onClose(); }}
        disabled={true}
      />
      <MenuItem label="Upload file" onClick={() => { onUploadFile(); onClose(); }} />
    </div>
  );

  return createPortal(menu, document.body);
}
