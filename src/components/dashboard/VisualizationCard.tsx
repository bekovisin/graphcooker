'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MoreVertical,
  Pencil,
  Copy,
  Trash2,
  FolderInput,
  Clock,
  BarChart3,
  Check,
  Share2,
} from 'lucide-react';
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
import type { FolderItem } from '@/store/dashboardStore';

export interface VizItem {
  id: number;
  projectId: number;
  name: string;
  chartType: string;
  thumbnail: string | null;
  sharedByUserId: number | null;
  sharedByName: string | null;
  createdAt: string;
  updatedAt: string;
  folderId: number | null;
}

export type CardSize = 'small' | 'medium' | 'large';

interface VisualizationCardProps {
  viz: VizItem;
  cardSize?: CardSize;
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

export function VisualizationCard({
  viz,
  cardSize = 'large',
  isSelected,
  isSelectionMode,
  onToggleSelect,
  onDelete,
  onDuplicate,
  onRename,
  onMoveToFolder,
  onShare,
  folders,
}: VisualizationCardProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(viz.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

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
    if (name && name !== viz.name) {
      onRename(viz.id, name);
    } else {
      setEditValue(viz.name);
    }
    setIsEditing(false);
  };

  const handleClick = () => {
    if (isSelectionMode) {
      onToggleSelect(viz.id);
    } else {
      router.push(`/editor/${viz.id}`);
    }
  };

  const chartTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      bar_stacked_custom: 'Bar Chart (Stacked)',
      bar_chart_custom_2: 'Bar Chart Custom 2',
    };
    return labels[type] || type;
  };

  return (
    <div
      className={`group relative rounded-lg border bg-white overflow-hidden transition-all cursor-pointer ${
        isSelected
          ? 'ring-2 ring-blue-500 border-blue-300 shadow-md'
          : 'hover:shadow-md hover:border-gray-300'
      }`}
      onClick={handleClick}
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
      {/* Selection checkbox overlay */}
      {isSelectionMode && (
        <div
          className="absolute top-2 left-2 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(viz.id);
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

      {/* Thumbnail / Preview */}
      <div className="aspect-[16/10] bg-white flex items-center justify-center border-b overflow-hidden">
        {viz.thumbnail ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={viz.thumbnail}
            alt={viz.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-1">
            <BarChart3 className={cardSize === 'small' ? 'w-5 h-5 text-gray-200' : cardSize === 'medium' ? 'w-6 h-6 text-gray-200' : 'w-8 h-8 text-gray-200'} />
            {cardSize !== 'small' && (
              <span className="text-[10px] text-gray-300">{chartTypeLabel(viz.chartType)}</span>
            )}
          </div>
        )}
      </div>

      {/* Card body */}
      <div className={cardSize === 'small' ? 'px-2 py-1.5' : cardSize === 'medium' ? 'px-2.5 py-2' : 'p-3'}>
        {isEditing ? (
          <input
            ref={inputRef}
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
            className={`w-full font-medium bg-white border border-blue-300 rounded px-1.5 py-0.5 outline-none ${
              cardSize === 'small' ? 'text-[10px]' : cardSize === 'medium' ? 'text-xs' : 'text-sm'
            }`}
          />
        ) : (
          <h3 className={`font-medium text-gray-800 truncate ${
            cardSize === 'small' ? 'text-[10px]' : cardSize === 'medium' ? 'text-xs' : 'text-sm'
          }`}>{viz.name}</h3>
        )}
        {viz.sharedByUserId && (
          <p className={`truncate text-blue-500 ${cardSize === 'small' ? 'text-[8px]' : cardSize === 'medium' ? 'text-[9px]' : 'text-[10px]'}`}>
            Shared by {viz.sharedByName || 'someone'}
          </p>
        )}

        <div className={`flex items-center justify-between ${cardSize === 'small' ? 'mt-0.5' : 'mt-1.5'}`}>
          <div className={`flex items-center gap-1 text-gray-400 ${
            cardSize === 'small' ? 'text-[9px]' : cardSize === 'medium' ? 'text-[10px]' : 'text-xs'
          }`}>
            <Clock className={cardSize === 'small' ? 'w-2 h-2' : cardSize === 'medium' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
            <span>{formatDate(viz.updatedAt)}</span>
          </div>

          {/* More menu */}
          {!isSelectionMode && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className={`rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors ${
                    cardSize === 'small' ? 'p-0.5' : 'p-1.5'
                  }`}
                >
                  <MoreVertical className={cardSize === 'small' ? 'w-3.5 h-3.5' : 'w-5 h-5'} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditValue(viz.name);
                    setIsEditing(true);
                  }}
                  className="gap-2 text-xs"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(viz.id);
                  }}
                  className="gap-2 text-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Duplicate
                </DropdownMenuItem>
                {onShare && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onShare(viz.id);
                    }}
                    className="gap-2 text-xs"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share
                  </DropdownMenuItem>
                )}

                {/* Move to folder */}
                {folders.length > 0 && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="gap-2 text-xs">
                      <FolderInput className="w-3.5 h-3.5" />
                      Move to folder
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-40">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveToFolder(viz.id, null);
                        }}
                        className="text-xs"
                      >
                        No folder (root)
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {folders.map((folder) => (
                        <DropdownMenuItem
                          key={folder.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveToFolder(viz.id, folder.id);
                          }}
                          className="text-xs"
                        >
                          {folder.name}
                          {viz.folderId === folder.id && (
                            <Check className="w-3 h-3 ml-auto text-blue-500" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(viz.id);
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
      </div>
    </div>
  );
}
