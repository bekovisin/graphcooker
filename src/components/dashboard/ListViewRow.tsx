'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, Share2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { FolderItem, VizItem } from '@/store/dashboardStore';

export interface ListViewRowProps {
  viz: VizItem;
  isSelected: boolean;
  isSelectionMode: boolean;
  onToggleSelect: (id: number) => void;
  onDelete: (id: number) => void;
  onDuplicate: (id: number) => void;
  onRename: (id: number, name: string) => void;
  onMoveToFolder: (id: number, folderId: number | null) => void;
  onShare?: (id: number) => void;
  folders: FolderItem[];
}

export function ListViewRow({
  viz,
  isSelected,
  isSelectionMode,
  onToggleSelect,
  onDelete,
  onDuplicate,
  onRename,
  onMoveToFolder,
  onShare,
  folders,
}: ListViewRowProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(viz.name);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleRename = () => {
    const name = editValue.trim();
    if (name && name !== viz.name) onRename(viz.id, name);
    else setEditValue(viz.name);
    setIsEditing(false);
  };

  const thumbnailImg = viz.thumbnail
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={viz.thumbnail} alt="" className="w-full h-full object-contain" />
    : <BarChart3 className="w-4 h-4 text-gray-200" />;

  return (
    <div
      className={`group flex items-center gap-3 px-4 py-2.5 rounded-md cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
      }`}
      onClick={() => {
        if (isSelectionMode) onToggleSelect(viz.id);
        else router.push(`/editor/${viz.id}`);
      }}
      draggable={!isSelectionMode && !isEditing}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', String(viz.id));
        e.dataTransfer.effectAllowed = 'move';
        if (e.currentTarget instanceof HTMLElement) {
          e.currentTarget.style.opacity = '0.5';
        }
      }}
      onDragEnd={(e) => {
        if (e.currentTarget instanceof HTMLElement) {
          e.currentTarget.style.opacity = '1';
        }
      }}
    >
      {/* Selection checkbox */}
      {isSelectionMode && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(viz.id);
          }}
          className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
            isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
          }`}
        >
          {isSelected && (
            <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
              <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </div>
      )}

      {/* Thumbnail */}
      <div className="w-12 h-8 rounded border bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden">
        {thumbnailImg}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') {
                setEditValue(viz.name);
                setIsEditing(false);
              }
              e.stopPropagation();
            }}
            onClick={(e) => e.stopPropagation()}
            autoFocus
            className="text-sm font-medium bg-white border border-blue-300 rounded px-1.5 py-0.5 outline-none w-64"
          />
        ) : (
          <span className="text-sm font-medium text-gray-800 truncate block">{viz.name}</span>
        )}
        {viz.sharedByUserId && (
          <span className="text-[10px] truncate text-blue-500">
            Shared by {viz.sharedByName || 'someone'}
          </span>
        )}
      </div>

      {/* Date */}
      <span className="text-xs text-gray-400 shrink-0">{formatDate(viz.updatedAt)}</span>

      {/* Actions */}
      {!isSelectionMode && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 text-gray-400 transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="3" r="1.5" />
                <circle cx="8" cy="8" r="1.5" />
                <circle cx="8" cy="13" r="1.5" />
              </svg>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setEditValue(viz.name);
                setIsEditing(true);
              }}
              className="text-xs"
            >
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(viz.id);
              }}
              className="text-xs"
            >
              Duplicate
            </DropdownMenuItem>
            {onShare && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(viz.id);
                }}
                className="text-xs gap-2"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share
              </DropdownMenuItem>
            )}
            {folders.length > 0 && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveToFolder(viz.id, null);
                }}
                className="text-xs"
              >
                Move to root
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete(viz.id);
              }}
              className="text-xs text-red-600 focus:text-red-600"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
