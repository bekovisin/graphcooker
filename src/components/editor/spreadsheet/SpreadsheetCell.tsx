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
          className="absolute inset-0 w-full h-full px-2 text-[13px] border-2 border-blue-500 outline-none bg-white z-10"
          style={{ width, height }}
        />
      ) : (
        <div
          className={`w-full h-full px-2 flex items-center text-[13px] border-r border-b overflow-hidden whitespace-nowrap text-ellipsis ${
            isActive
              ? 'border-blue-500 border-2 -m-[1px] z-[5]'
              : isSelected
              ? 'bg-blue-50 border-gray-200'
              : 'border-gray-200'
          }`}
          style={{ width: isActive ? width + 2 : width, height: isActive ? height + 2 : height }}
        >
          <span className="truncate">{value != null ? String(value) : ''}</span>
        </div>
      )}
    </div>
  );
});
