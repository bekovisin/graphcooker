'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FolderOpen,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Pencil,
  Trash2,
  Home,
  BarChart3,
  Download,
  CheckSquare,
  Square,
  Settings,
  Users,
  LogOut,
  Globe,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getDescendantIds } from '@/lib/folder-utils';

export interface FolderItem {
  id: number;
  name: string;
  parentId: number | null;
  createdAt: string;
}

export interface VizItem {
  id: number;
  name: string;
  folderId: number | null;
  chartType: string;
  thumbnail: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSidebarProps {
  folders: FolderItem[];
  visualizations: VizItem[];
  activeFolderId: number | null;
  onFolderSelect: (folderId: number | null) => void;
  onCreateFolder: (name: string, parentId?: number | null) => void;
  onRenameFolder: (id: number, name: string) => void;
  onDeleteFolder: (id: number) => void;
  onMoveToFolder: (vizId: number, folderId: number | null) => void;
  onMoveFolderToFolder?: (folderId: number, targetParentId: number | null) => void;
  vizCountByFolder: Record<string, number>;
  totalVizCount: number;
  isSelectionMode: boolean;
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onExportSingle: (id: number) => void;
  onTrashSelect?: () => void;
  isTrashActive?: boolean;
  trashCount?: number;
}

export function DashboardSidebar({
  folders,
  visualizations,
  activeFolderId,
  onFolderSelect,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveToFolder,
  onMoveFolderToFolder,
  vizCountByFolder,
  totalVizCount,
  isSelectionMode,
  selectedIds,
  onToggleSelect,
  onExportSingle,
  onTrashSelect,
  isTrashActive,
  trashCount,
}: DashboardSidebarProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [creatingSubfolderId, setCreatingSubfolderId] = useState<number | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<number | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [dragOverFolderId, setDragOverFolderId] = useState<number | 'root' | null>(null);
  const newFolderInputRef = useRef<HTMLInputElement>(null);
  const subFolderInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (creatingFolder && newFolderInputRef.current) {
      newFolderInputRef.current.focus();
    }
  }, [creatingFolder]);

  useEffect(() => {
    if (creatingSubfolderId !== null && subFolderInputRef.current) {
      subFolderInputRef.current.focus();
    }
  }, [creatingSubfolderId]);

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

  const handleCreateSubfolder = (parentId: number) => {
    const name = newFolderName.trim();
    if (name) {
      onCreateFolder(name, parentId);
    }
    setNewFolderName('');
    setCreatingSubfolderId(null);
  };

  const handleRenameFolder = (id: number) => {
    const name = editFolderName.trim();
    if (name) {
      onRenameFolder(id, name);
    }
    setEditingFolderId(null);
    setEditFolderName('');
  };

  const handleDragOver = (e: React.DragEvent, folderId: number | 'root') => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolderId(folderId);
  };

  const handleDragLeave = () => {
    setDragOverFolderId(null);
  };

  const handleDrop = (e: React.DragEvent, targetFolderId: number | null) => {
    e.preventDefault();
    setDragOverFolderId(null);

    // Check if this is a folder drop
    const draggedFolderIdStr = e.dataTransfer.getData('application/x-folder-id');
    if (draggedFolderIdStr) {
      const draggedFolderId = parseInt(draggedFolderIdStr);
      if (isNaN(draggedFolderId)) return;
      // Prevent dropping onto self
      if (draggedFolderId === targetFolderId) return;
      // Prevent circular: can't drop into own descendant
      if (targetFolderId !== null) {
        const descendants = getDescendantIds(draggedFolderId, folders);
        if (descendants.has(targetFolderId)) return;
      }
      onMoveFolderToFolder?.(draggedFolderId, targetFolderId);
      return;
    }

    // Otherwise it's a viz drop
    const vizId = parseInt(e.dataTransfer.getData('text/plain'));
    if (!isNaN(vizId)) {
      onMoveToFolder(vizId, targetFolderId);
    }
  };

  // Build folder tree
  const rootFolders = folders.filter((f) => f.parentId === null);
  const childFolders = (parentId: number) => folders.filter((f) => f.parentId === parentId);
  const vizInFolder = (folderId: number) => visualizations.filter((v) => v.folderId === folderId);

  const renderVizItem = (viz: VizItem, depth: number) => {
    const isSelected = selectedIds.has(viz.id);
    return (
      <div
        key={`viz-${viz.id}`}
        className={`group flex items-center gap-1.5 py-1 rounded-md cursor-pointer transition-colors text-xs ${
          isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
        }`}
        style={{ paddingLeft: `${16 + (depth + 1) * 16}px`, paddingRight: '8px' }}
        onClick={() => {
          if (isSelectionMode) {
            onToggleSelect(viz.id);
          } else {
            router.push(`/editor/${viz.id}`);
          }
        }}
      >
        {isSelectionMode && (
          <span className="shrink-0">
            {isSelected ? (
              <CheckSquare className="w-3 h-3 text-blue-500" />
            ) : (
              <Square className="w-3 h-3 text-gray-400" />
            )}
          </span>
        )}
        <BarChart3 className="w-3 h-3 shrink-0 text-gray-400" />
        <span className="flex-1 truncate">{viz.name}</span>
        {!isSelectionMode && (
          <button
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-200 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onExportSingle(viz.id);
            }}
            title="Export"
          >
            <Download className="w-3 h-3 text-gray-500" />
          </button>
        )}
      </div>
    );
  };

  const renderFolder = (folder: FolderItem, depth: number = 0) => {
    const children = childFolders(folder.id);
    const folderViz = vizInFolder(folder.id);
    const hasChildren = children.length > 0 || folderViz.length > 0;
    const isExpanded = expandedFolders.has(folder.id);
    const isActive = activeFolderId === folder.id;
    const isEditing = editingFolderId === folder.id;
    const count = vizCountByFolder[String(folder.id)] || 0;
    const isDragOver = dragOverFolderId === folder.id;

    return (
      <div key={folder.id}>
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('application/x-folder-id', String(folder.id));
            e.dataTransfer.effectAllowed = 'move';
          }}
          className={`group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-colors text-sm ${
            isDragOver
              ? 'bg-blue-100 ring-2 ring-blue-300'
              : isActive
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => {
            onFolderSelect(folder.id);
            if (hasChildren) toggleFolder(folder.id);
          }}
          onDragOver={(e) => handleDragOver(e, folder.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, folder.id)}
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
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setNewFolderName('');
                    setCreatingSubfolderId(folder.id);
                    setExpandedFolders((prev) => new Set(prev).add(folder.id));
                  }}
                  className="gap-2 text-xs"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  New sub-folder
                </DropdownMenuItem>
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

        {/* Expanded: child folders + visualizations + sub-folder input */}
        {isExpanded && (
          <>
            {children.map((child) => renderFolder(child, depth + 1))}
            {creatingSubfolderId === folder.id && (
              <div
                className="flex items-center gap-1 py-1.5"
                style={{ paddingLeft: `${16 + (depth + 1) * 16}px`, paddingRight: '8px' }}
              >
                <FolderOpen className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <input
                  ref={subFolderInputRef}
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onBlur={() => handleCreateSubfolder(folder.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateSubfolder(folder.id);
                    if (e.key === 'Escape') {
                      setCreatingSubfolderId(null);
                      setNewFolderName('');
                    }
                  }}
                  placeholder="Sub-folder name..."
                  className="flex-1 text-xs bg-white border border-blue-300 rounded px-1.5 py-0.5 outline-none min-w-0"
                />
              </div>
            )}
            {folderViz.map((viz) => renderVizItem(viz, depth))}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="w-full md:w-56 border-r border-gray-200 bg-gray-50/50 flex flex-col shrink-0 min-h-0 h-full">
      <div className="px-3 py-[17.5px] border-b border-gray-200 flex items-center justify-between">
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
        {/* All items - also a drop target for root */}
        <div
          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors cursor-pointer ${
            dragOverFolderId === 'root'
              ? 'bg-blue-100 ring-2 ring-blue-300'
              : activeFolderId === null
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          onClick={() => onFolderSelect(null)}
          onDragOver={(e) => handleDragOver(e, 'root')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, null)}
        >
          <Home className={`w-4 h-4 ${activeFolderId === null ? 'text-blue-500' : 'text-gray-400'}`} />
          <span className="flex-1 text-left">All visualizations</span>
          <span className="text-[10px] text-gray-400 tabular-nums">{totalVizCount}</span>
        </div>

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

      {/* Bottom: Trash, Settings, User Profile */}
      <div className="border-t border-gray-200 p-2 space-y-0.5">
        {onTrashSelect && (
          <button
            onClick={onTrashSelect}
            className={`flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-sm transition-colors ${
              isTrashActive
                ? 'bg-red-50 text-red-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Trash2 className={`w-4 h-4 ${isTrashActive ? 'text-red-500' : 'text-gray-400'}`} />
            <span className="flex-1 text-left">Trash</span>
            {(trashCount ?? 0) > 0 && (
              <span className="text-[10px] text-gray-400 tabular-nums">{trashCount}</span>
            )}
          </button>
        )}
        <Link
          href="/settings"
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
        >
          <Settings className="w-4 h-4 text-gray-400" />
          General Settings
        </Link>
        {user?.role === 'admin' && (
          <Link
            href="/admin/users"
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Users className="w-4 h-4 text-gray-400" />
            User Management
          </Link>
        )}
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
        >
          <Globe className="w-4 h-4 text-gray-400" />
          Landing Page
        </Link>
      </div>

      {/* User Profile Card */}
      {user && (
        <div className="border-t border-gray-200 p-2">
          <Link
            href="/profile"
            className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-100 transition-colors group"
          >
            <div className="w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-semibold shrink-0" style={{ background: 'linear-gradient(135deg, #FDBA74 0%, #F97316 50%, #EA580C 100%)' }}>
              {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{user.name}</div>
              <div className="flex items-center gap-1.5">
                <span className={`inline-flex items-center px-1.5 py-0 text-[10px] font-medium rounded-full ${
                  user.role === 'admin'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {user.role === 'admin' ? 'Admin' : 'Customer'}
                </span>
              </div>
            </div>
            <LogOut
              className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:text-red-500 transition-all shrink-0"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); logout(); }}
            />
          </Link>
        </div>
      )}
    </div>
  );
}
