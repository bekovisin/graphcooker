'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Trash2,
  FolderOpen,
  BarChart3,
} from 'lucide-react';
import { useDashboardStore } from '@/store/dashboardStore';
import { LoadingBar } from '@/components/ui/loading-bar';

export default function TrashPage() {
  // Individual selectors to prevent full-store subscription
  const trashItems = useDashboardStore((s) => s.trashItems);
  const loading = useDashboardStore((s) => s.loading);
  const thumbnailsLoading = useDashboardStore((s) => s.thumbnailsLoading);
  const fetchTrash = useDashboardStore((s) => s.fetchTrash);
  const restoreTrashItem = useDashboardStore((s) => s.restoreTrashItem);
  const permanentDeleteTrashItem = useDashboardStore((s) => s.permanentDeleteTrashItem);
  const emptyTrash = useDashboardStore((s) => s.emptyTrash);

  // Fetch trash on mount
  useEffect(() => {
    fetchTrash();
  }, [fetchTrash]);

  // Loading
  if (loading) {
    return <LoadingBar />;
  }

  const totalTrash = trashItems.visualizations.length + trashItems.folders.length;

  // Empty trash state
  if (totalTrash === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-8 h-8 text-gray-300" />
        </div>
        <h3 className="text-lg font-medium text-gray-700 mb-1">Trash is empty</h3>
        <p className="text-sm text-gray-500">Deleted items will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{totalTrash} item{totalTrash > 1 ? 's' : ''} in trash</p>
        <Button variant="destructive" size="sm" className="gap-1.5 text-xs" onClick={emptyTrash}>
          <Trash2 className="w-3.5 h-3.5" />
          Empty trash
        </Button>
      </div>

      {/* Trashed folders */}
      {trashItems.folders.map((folder) => (
        <div
          key={`trash-folder-${folder.id}`}
          className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
        >
          <FolderOpen className="w-5 h-5 text-gray-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-gray-800 truncate block">{folder.name}</span>
            <span className="text-[10px] text-gray-400">
              Folder · Deleted {new Date(folder.deletedAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => restoreTrashItem(folder.id, 'folder')}
            >
              Restore
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => permanentDeleteTrashItem(folder.id, 'folder')}
            >
              Delete
            </Button>
          </div>
        </div>
      ))}

      {/* Trashed visualizations */}
      {trashItems.visualizations.map((viz) => (
        <div
          key={`trash-viz-${viz.id}`}
          className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
        >
          <div className="w-10 h-7 rounded border bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden">
            {viz.thumbnail ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={viz.thumbnail} alt="" className="w-full h-full object-contain" />
            ) : thumbnailsLoading ? (
              <div className="w-full h-full bg-gray-100 animate-pulse rounded" />
            ) : (
              <BarChart3 className="w-4 h-4 text-gray-200" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-gray-800 truncate block">{viz.name}</span>
            <span className="text-[10px] text-gray-400">
              {viz.chartType} · Deleted {new Date(viz.deletedAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => restoreTrashItem(viz.id, 'visualization')}
            >
              Restore
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => permanentDeleteTrashItem(viz.id, 'visualization')}
            >
              Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
