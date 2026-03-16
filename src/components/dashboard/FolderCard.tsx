'use client';

import { useState, useRef, useEffect } from 'react';
import { FolderOpen, MoreVertical, Copy, Pencil, FolderInput, Trash2, Check, Share2, Palette } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getDescendantIds } from '@/lib/folder-utils';

interface FolderItem {
  id: number;
  name: string;
  parentId: number | null;
  sharedByUserId?: number | null;
  sharedByName?: string | null;
  bgColor?: string | null;
  textColor?: string | null;
  iconColor?: string | null;
}

const PRESET_BG_COLORS = [
  '#f9fafb', '#fef3c7', '#fce7f3', '#dbeafe', '#d1fae5',
  '#ede9fe', '#fee2e2', '#ffedd5', '#e0e7ff', '#cffafe',
  '#f3e8ff', '#fef9c3',
];

const PRESET_ICON_COLORS = [
  '#9ca3af', '#f59e0b', '#ec4899', '#3b82f6', '#10b981',
  '#8b5cf6', '#ef4444', '#f97316', '#6366f1', '#06b6d4',
  '#a855f7', '#eab308',
];

const PRESET_TEXT_COLORS = [
  '#374151', '#92400e', '#9d174d', '#1e40af', '#065f46',
  '#5b21b6', '#991b1b', '#9a3412', '#3730a3', '#155e75',
  '#6b21a8', '#854d0e',
];

interface FolderCardProps {
  folder: FolderItem;
  cardSize?: 'small' | 'medium' | 'large';
  vizCount: number;
  subFolderCount?: number;
  allFolders?: FolderItem[];
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onToggleSelect?: (id: number) => void;
  onClick: () => void;
  onDrop: (vizId: number) => void;
  onDropFolder?: (draggedFolderId: number) => void;
  onRename?: (id: number, name: string) => void;
  onDuplicate?: (id: number) => void;
  onMove?: (id: number, targetFolderId: number | null) => void;
  onDelete?: (id: number) => void;
  onShare?: (id: number) => void;
  onUpdateColors?: (id: number, colors: { bgColor?: string; textColor?: string; iconColor?: string }) => void;
}

export function FolderCard({
  folder,
  cardSize = 'large',
  vizCount,
  subFolderCount = 0,
  allFolders,
  isSelected = false,
  isSelectionMode = false,
  onToggleSelect,
  onClick,
  onDrop,
  onDropFolder,
  onRename,
  onDuplicate,
  onMove,
  onDelete,
  onShare,
  onUpdateColors,
}: FolderCardProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);
  const [colorPopoverOpen, setColorPopoverOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleRenameSubmit = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== folder.name && onRename) {
      onRename(folder.id, trimmed);
    }
    setIsEditing(false);
  };

  // Filter available target folders (exclude self and all descendants to prevent circular refs)
  const descendants = allFolders ? getDescendantIds(folder.id, allFolders) : new Set<number>();
  const moveTargets = (allFolders || []).filter((f) => {
    if (f.id === folder.id) return false;
    if (descendants.has(f.id)) return false;
    return true;
  });

  const hasMenu = onRename || onDuplicate || onMove || onDelete || onShare || onUpdateColors;

  const bgColor = folder.bgColor || '#f9fafb';
  const iconColor = isDragOver ? '#60a5fa' : (folder.iconColor || '#9ca3af');
  const textColor = folder.textColor || '#6b7280';

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/x-folder-id', String(folder.id));
        e.dataTransfer.effectAllowed = 'move';
      }}
      className={`group relative rounded-lg border bg-white overflow-hidden transition-all cursor-pointer hover:shadow-md hover:border-gray-300 ${
        isDragOver ? 'ring-2 ring-blue-400 bg-blue-50 border-blue-300' : isSelected ? 'ring-2 ring-blue-400 border-blue-300' : 'border-gray-200'
      }`}
      onClick={() => {
        if (isEditing) return;
        if (isSelectionMode && onToggleSelect) {
          onToggleSelect(folder.id);
          return;
        }
        onClick();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);

        // Check for folder drop first
        const draggedFolderIdStr = e.dataTransfer.getData('application/x-folder-id');
        if (draggedFolderIdStr) {
          const draggedFolderId = parseInt(draggedFolderIdStr);
          if (isNaN(draggedFolderId)) return;
          if (draggedFolderId === folder.id) return;
          if (descendants.has(draggedFolderId)) return;
          onDropFolder?.(draggedFolderId);
          return;
        }

        // Otherwise viz drop
        const vizId = parseInt(e.dataTransfer.getData('text/plain'));
        if (!isNaN(vizId)) onDrop(vizId);
      }}
    >
      {/* Selection checkbox */}
      {isSelectionMode && onToggleSelect && (
        <div
          className="absolute top-2 left-2 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(folder.id);
          }}
        >
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              isSelected
                ? 'bg-blue-500 border-blue-500'
                : 'bg-white/90 border-gray-300 hover:border-blue-400'
            }`}
          >
            {isSelected && <Check className="w-3 h-3 text-white" />}
          </div>
        </div>
      )}

      {/* Folder visual */}
      <div
        className="aspect-[16/10] flex flex-col items-center justify-center rounded-t-lg border-b border-gray-100 overflow-hidden"
        style={{ backgroundColor: bgColor }}
      >
        <FolderOpen
          className={`${cardSize === 'small' ? 'w-7 h-7' : cardSize === 'medium' ? 'w-9 h-9' : 'w-12 h-12'} transition-colors`}
          style={{ color: iconColor }}
        />
        <span
          className={`mt-1 ${cardSize === 'small' ? 'text-[9px]' : cardSize === 'medium' ? 'text-[10px]' : 'text-xs'}`}
          style={{ color: textColor }}
        >
          {vizCount > 0 && `${vizCount} ${vizCount === 1 ? 'item' : 'items'}`}
          {vizCount > 0 && subFolderCount > 0 && ', '}
          {subFolderCount > 0 && `${subFolderCount} ${subFolderCount === 1 ? 'folder' : 'folders'}`}
          {vizCount === 0 && subFolderCount === 0 && '0 items'}
        </span>
      </div>

      {/* Name + menu */}
      <div className={cardSize === 'small' ? 'px-2 py-1.5' : cardSize === 'medium' ? 'px-2.5 py-2' : 'px-3 py-2.5'}>
        {isEditing ? (
          <input
            ref={inputRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit();
              if (e.key === 'Escape') setIsEditing(false);
            }}
            className={`font-medium text-gray-900 w-full border border-blue-400 rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-blue-400 ${
              cardSize === 'small' ? 'text-[10px]' : cardSize === 'medium' ? 'text-xs' : 'text-sm'
            }`}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div className="flex items-center justify-between gap-1">
            <div className="flex-1 min-w-0">
              <p className={`font-medium text-gray-900 truncate ${
                cardSize === 'small' ? 'text-[10px]' : cardSize === 'medium' ? 'text-xs' : 'text-sm'
              }`}>{folder.name}</p>
              {folder.sharedByUserId && (
                <p className={`truncate text-blue-500 ${cardSize === 'small' ? 'text-[8px]' : cardSize === 'medium' ? 'text-[9px]' : 'text-[10px]'}`}>
                  Shared by {folder.sharedByName || 'someone'}
                </p>
              )}
            </div>
            {hasMenu && (
              <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className={`rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors ${
                      cardSize === 'small' ? 'p-0.5' : 'p-1.5'
                    }`}>
                      <MoreVertical className={cardSize === 'small' ? 'w-3.5 h-3.5' : 'w-5 h-5'} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {onRename && (
                      <DropdownMenuItem onClick={() => { setEditName(folder.name); setIsEditing(true); }}>
                        <Pencil className="w-3.5 h-3.5 mr-2" />
                        Rename
                      </DropdownMenuItem>
                    )}
                    {onUpdateColors && (
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          setColorPopoverOpen(true);
                        }}
                      >
                        <Palette className="w-3.5 h-3.5 mr-2" />
                        Change Color
                      </DropdownMenuItem>
                    )}
                    {onDuplicate && (
                      <DropdownMenuItem onClick={() => onDuplicate(folder.id)}>
                        <Copy className="w-3.5 h-3.5 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                    )}
                    {onShare && (
                      <DropdownMenuItem onClick={() => onShare(folder.id)}>
                        <Share2 className="w-3.5 h-3.5 mr-2" />
                        Share
                      </DropdownMenuItem>
                    )}
                    {onMove && moveTargets.length > 0 && (
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <FolderInput className="w-3.5 h-3.5 mr-2" />
                          Move to folder
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-44">
                          {folder.parentId && (
                            <DropdownMenuItem onClick={() => onMove(folder.id, null)}>
                              No folder (root)
                            </DropdownMenuItem>
                          )}
                          {folder.parentId && moveTargets.length > 0 && <DropdownMenuSeparator />}
                          {moveTargets.map((target) => (
                            <DropdownMenuItem
                              key={target.id}
                              onClick={() => onMove(folder.id, target.id)}
                            >
                              {target.name}
                              {folder.parentId === target.id && (
                                <span className="ml-auto text-xs text-gray-400">current</span>
                              )}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    )}
                    {onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(folder.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Color picker dialog */}
      {onUpdateColors && (
        <Dialog open={colorPopoverOpen} onOpenChange={setColorPopoverOpen}>
          <DialogContent className="sm:max-w-[340px] p-0 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-5">
              <DialogHeader className="flex-row items-center gap-3 space-y-0 mb-4">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: bgColor }}
                >
                  <FolderOpen className="w-4.5 h-4.5" style={{ color: iconColor }} />
                </div>
                <DialogTitle className="text-sm font-semibold text-gray-900">
                  Change folder color
                </DialogTitle>
              </DialogHeader>

              {/* Preview */}
              <div
                className="rounded-lg border border-gray-200 p-4 flex flex-col items-center justify-center mb-4"
                style={{ backgroundColor: bgColor }}
              >
                <FolderOpen className="w-8 h-8" style={{ color: iconColor }} />
                <span className="text-xs mt-1 font-medium" style={{ color: textColor }}>
                  {folder.name}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">Background</label>
                  <div className="grid grid-cols-6 gap-1.5">
                    {PRESET_BG_COLORS.map((c) => (
                      <button
                        key={c}
                        className={`w-7 h-7 rounded-md border-2 transition-all hover:scale-110 ${
                          bgColor === c ? 'border-blue-500 ring-1 ring-blue-300' : 'border-gray-200'
                        }`}
                        style={{ backgroundColor: c }}
                        onClick={() => onUpdateColors(folder.id, { bgColor: c })}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">Icon</label>
                  <div className="grid grid-cols-6 gap-1.5">
                    {PRESET_ICON_COLORS.map((c) => (
                      <button
                        key={c}
                        className={`w-7 h-7 rounded-md border-2 transition-all hover:scale-110 ${
                          (folder.iconColor || '#9ca3af') === c ? 'border-blue-500 ring-1 ring-blue-300' : 'border-gray-200'
                        }`}
                        style={{ backgroundColor: c }}
                        onClick={() => onUpdateColors(folder.id, { iconColor: c })}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">Text</label>
                  <div className="grid grid-cols-6 gap-1.5">
                    {PRESET_TEXT_COLORS.map((c) => (
                      <button
                        key={c}
                        className={`w-7 h-7 rounded-md border-2 transition-all hover:scale-110 ${
                          (folder.textColor || '#374151') === c ? 'border-blue-500 ring-1 ring-blue-300' : 'border-gray-200'
                        }`}
                        style={{ backgroundColor: c }}
                        onClick={() => onUpdateColors(folder.id, { textColor: c })}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
