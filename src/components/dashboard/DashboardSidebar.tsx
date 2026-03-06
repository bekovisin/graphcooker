'use client';

import { useState, useRef, useEffect } from 'react';
import {
  FolderOpen,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Pencil,
  Trash2,
  Home,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface FolderItem {
  id: number;
  name: string;
  parentId: number | null;
  createdAt: string;
}

interface DashboardSidebarProps {
  folders: FolderItem[];
  activeFolderId: number | null;
  onFolderSelect: (folderId: number | null) => void;
  onCreateFolder: (name: string, parentId?: number | null) => void;
  onRenameFolder: (id: number, name: string) => void;
  onDeleteFolder: (id: number) => void;
  vizCountByFolder: Record<string, number>;
  totalVizCount: number;
}

export function DashboardSidebar({
  folders,
  activeFolderId,
  onFolderSelect,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  vizCountByFolder,
  totalVizCount,
}: DashboardSidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<number | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const newFolderInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (creatingFolder && newFolderInputRef.current) {
      newFolderInputRef.current.focus();
    }
  }, [creatingFolder]);

  useEffect(() => {
    if (editingFolderId !== null && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingFolderId]);

  const toggleFolder = (id: number) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateFolder = () => {
    const name = newFolderName.trim();
    if (name) {
      onCreateFolder(name);
    }
    setNewFolderName('');
    setCreatingFolder(false);
  };

  const handleRenameFolder = (id: number) => {
    const name = editFolderName.trim();
    if (name) {
      onRenameFolder(id, name);
    }
    setEditingFolderId(null);
    setEditFolderName('');
  };

  // Build folder tree
  const rootFolders = folders.filter((f) => f.parentId === null);
  const childFolders = (parentId: number) => folders.filter((f) => f.parentId === parentId);

  const renderFolder = (folder: FolderItem, depth: number = 0) => {
    const children = childFolders(folder.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedFolders.has(folder.id);
    const isActive = activeFolderId === folder.id;
    const isEditing = editingFolderId === folder.id;
    const count = vizCountByFolder[String(folder.id)] || 0;

    return (
      <div key={folder.id}>
        <div
          className={`group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-colors text-sm ${
            isActive
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => {
            onFolderSelect(folder.id);
            if (hasChildren) toggleFolder(folder.id);
          }}
        >
          {/* Expand/collapse chevron */}
          <span className="w-4 h-4 flex items-center justify-center shrink-0">
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )
            ) : null}
          </span>

          <FolderOpen className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />

          {isEditing ? (
            <input
              ref={editInputRef}
              value={editFolderName}
              onChange={(e) => setEditFolderName(e.target.value)}
              onBlur={() => handleRenameFolder(folder.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameFolder(folder.id);
                if (e.key === 'Escape') {
                  setEditingFolderId(null);
                  setEditFolderName('');
                }
                e.stopPropagation();
              }}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 text-sm bg-white border border-blue-300 rounded px-1 py-0 outline-none min-w-0"
            />
          ) : (
            <span className="flex-1 truncate">{folder.name}</span>
          )}

          {count > 0 && !isEditing && (
            <span className="text-[10px] text-gray-400 tabular-nums">{count}</span>
          )}

          {/* More menu */}
          {!isEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-200 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="w-3.5 h-3.5 text-gray-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditFolderName(folder.name);
                    setEditingFolderId(folder.id);
                  }}
                  className="gap-2 text-xs"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFolder(folder.id);
                  }}
                  className="gap-2 text-xs text-red-600 focus:text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Children */}
        {isExpanded && children.map((child) => renderFolder(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="w-56 border-r bg-gray-50/50 flex flex-col shrink-0 h-full">
      <div className="p-3 border-b flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Folders</span>
        <button
          onClick={() => {
            setNewFolderName('');
            setCreatingFolder(true);
          }}
          className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
          title="New folder"
        >
          <FolderPlus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {/* All items */}
        <button
          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
            activeFolderId === null
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          onClick={() => onFolderSelect(null)}
        >
          <Home className={`w-4 h-4 ${activeFolderId === null ? 'text-blue-500' : 'text-gray-400'}`} />
          <span className="flex-1 text-left">All visualizations</span>
          <span className="text-[10px] text-gray-400 tabular-nums">{totalVizCount}</span>
        </button>

        {/* Separator */}
        {folders.length > 0 && <div className="border-b border-gray-200 my-2" />}

        {/* Folder tree */}
        {rootFolders.map((folder) => renderFolder(folder))}

        {/* New folder input */}
        {creatingFolder && (
          <div className="flex items-center gap-1 px-3 py-1.5">
            <FolderOpen className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              ref={newFolderInputRef}
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onBlur={handleCreateFolder}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder();
                if (e.key === 'Escape') {
                  setCreatingFolder(false);
                  setNewFolderName('');
                }
              }}
              placeholder="Folder name..."
              className="flex-1 text-sm bg-white border border-blue-300 rounded px-1.5 py-0.5 outline-none min-w-0"
            />
          </div>
        )}
      </div>
    </div>
  );
}
