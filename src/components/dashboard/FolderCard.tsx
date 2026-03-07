'use client';

import { useState, useRef, useEffect } from 'react';
import { FolderOpen, MoreHorizontal, Copy, Pencil, FolderInput, Trash2 } from 'lucide-react';
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

interface FolderItem {
  id: number;
  name: string;
  parentId?: number | null;
}

interface FolderCardProps {
  folder: FolderItem;
  vizCount: number;
  allFolders?: FolderItem[];
  onClick: () => void;
  onDrop: (vizId: number) => void;
  onRename?: (id: number, name: string) => void;
  onDuplicate?: (id: number) => void;
  onMove?: (id: number, targetFolderId: number | null) => void;
  onDelete?: (id: number) => void;
}

export function FolderCard({
  folder,
  vizCount,
  allFolders,
  onClick,
  onDrop,
  onRename,
  onDuplicate,
  onMove,
  onDelete,
}: FolderCardProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);
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

  // Filter available target folders (exclude self and own children to prevent circular refs)
  const moveTargets = (allFolders || []).filter((f) => {
    if (f.id === folder.id) return false;
    // Prevent moving into own children (simple 1-level check)
    if (f.parentId === folder.id) return false;
    return true;
  });

  const hasMenu = onRename || onDuplicate || onMove || onDelete;

  return (
    <div
      className={`group relative rounded-lg border bg-white transition-all cursor-pointer hover:shadow-md ${
        isDragOver ? 'ring-2 ring-blue-400 bg-blue-50 border-blue-300' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => {
        if (isEditing) return;
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
        const vizId = parseInt(e.dataTransfer.getData('text/plain'));
        if (!isNaN(vizId)) onDrop(vizId);
      }}
    >
      {/* Context menu button */}
      {hasMenu && (
        <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100">
                <MoreHorizontal className="w-4 h-4 text-gray-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onRename && (
                <DropdownMenuItem onClick={() => { setEditName(folder.name); setIsEditing(true); }}>
                  <Pencil className="w-3.5 h-3.5 mr-2" />
                  Rename
                </DropdownMenuItem>
              )}
              {onDuplicate && (
                <DropdownMenuItem onClick={() => onDuplicate(folder.id)}>
                  <Copy className="w-3.5 h-3.5 mr-2" />
                  Duplicate
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
              {onMove && !folder.parentId && moveTargets.length === 0 ? null : null}
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

      {/* Folder visual */}
      <div className="aspect-[16/10] flex flex-col items-center justify-center bg-gray-50 rounded-t-lg border-b border-gray-100">
        <FolderOpen className={`w-12 h-12 ${isDragOver ? 'text-blue-400' : 'text-gray-300'} transition-colors`} />
        <span className="text-xs text-gray-400 mt-1">
          {vizCount} {vizCount === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Name */}
      <div className="px-3 py-2.5">
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
            className="text-sm font-medium text-gray-900 w-full border border-blue-400 rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-blue-400"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <p className="text-sm font-medium text-gray-900 truncate">{folder.name}</p>
        )}
      </div>
    </div>
  );
}
