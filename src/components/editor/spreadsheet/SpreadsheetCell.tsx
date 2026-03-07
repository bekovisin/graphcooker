'use client';

import { memo, useCallback, useEffect, useRef } from 'react';

interface SpreadsheetCellProps {
  value: string | number | null;
  width: number;
  height: number;
  isActive: boolean;
  isSelected: boolean;
  isEditing: boolean;
  editValue: string;
  onEditValueChange: (value: string) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onEditCommit: (value: string) => void;
  onEditCancel: () => void;
}

export const SpreadsheetCell = memo(function SpreadsheetCell({
  value,
  width,
  height,
  isActive,
  isSelected,
  isEditing,
  editValue,
  onEditValueChange,
  onMouseDown,
  onDoubleClick,
  onEditCommit,
  onEditCancel,
}: SpreadsheetCellProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onEditCommit(editValue);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onEditCancel();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        onEditCommit(editValue);
      }
    },
    [editValue, onEditCommit, onEditCancel]
  );

  return (
    <div
      className="shrink-0 relative"
      style={{ width, height }}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => onEditValueChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => onEditCommit(editValue)}
          onFocus={(e) => e.target.select()}
          className="absolute inset-0 w-full h-full px-2 text-[13px] outline-none bg-white z-10"
          style={{
            width,
            height,
            boxShadow: '0 0 0 2px #3b82f6 inset',
          }}
        />
      ) : (
        <div
          className="w-full h-full px-2 flex items-center text-[13px] border-r border-b border-gray-200 overflow-hidden whitespace-nowrap text-ellipsis select-none"
          style={{
            width,
            height,
            ...(isActive
              ? {
                  outline: '2px solid #3b82f6',
                  outlineOffset: '-2px',
                  zIndex: 5,
                  position: 'relative' as const,
                }
              : isSelected
              ? { backgroundColor: '#eff6ff' }
              : {}),
          }}
        >
          <span className="truncate pointer-events-none">{value != null ? String(value) : ''}</span>
        </div>
      )}
    </div>
  );
});
